import logging
from typing import List, Dict, Any, Optional
import numpy as np
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from app.core.config import settings, api_key_rotator
from app.core.telemetry import telemetry

logger = logging.getLogger(__name__)

class MatryoshkaEmbeddings(Embeddings):
    """
    Wraps embeddings model to truncate Matryoshka representations to the exact target
    dimension required by the Pinecone index (e.g., 1024) while preserving unit L2 normalization.
    """
    def __init__(self, base_embeddings: Embeddings, target_dim: int = 1024):
        self.base_embeddings = base_embeddings
        self.target_dim = target_dim

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        raw_vectors = self.base_embeddings.embed_documents(texts)
        return [self._truncate(v) for v in raw_vectors]

    def embed_query(self, text: str) -> List[float]:
        raw_vector = self.base_embeddings.embed_query(text)
        return self._truncate(raw_vector)

    def _truncate(self, vector: List[float]) -> List[float]:
        if len(vector) <= self.target_dim:
            return vector
        arr = np.array(vector[:self.target_dim], dtype=np.float32)
        norm = np.linalg.norm(arr)
        if norm > 0:
            arr = arr / norm
        return arr.tolist()


class VectorService:
    def __init__(self):
        self.pc = None
        self.index_name = settings.PINECONE_INDEX_NAME
        self.dimension = 1024
        self.initialized = False
        self._init_pinecone()

    def _init_pinecone(self):
        if not settings.PINECONE_API_KEY:
            logger.warning("PINECONE_API_KEY not configured. Vector search operates in fallback mode.")
            return
        try:
            self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            self.initialized = True
            self.ensure_index()
            # Auto-detect target dimension from the Pinecone index description
            try:
                desc = self.pc.describe_index(self.index_name)
                if desc and hasattr(desc, "dimension"):
                    self.dimension = desc.dimension
                    logger.info(f"Connected to Pinecone index '{self.index_name}' with dimension {self.dimension}")
            except Exception as e:
                logger.warning(f"Could not read index dimension, using default 1024: {e}")
        except Exception as e:
            logger.error(f"Pinecone client init failed: {e}")
            self.initialized = False

    def get_embeddings(self) -> Optional[Embeddings]:
        keys = api_key_rotator.get_rotated_google_keys()
        if not keys:
            return None
        for key in keys:
            try:
                base = GoogleGenerativeAIEmbeddings(
                    model="gemini-embedding-001",
                    task_type="retrieval_document",
                    google_api_key=key
                )
                return MatryoshkaEmbeddings(base, target_dim=self.dimension)
            except Exception:
                continue
        return None

    def ensure_index(self):
        if not self.initialized or not self.pc:
            return
        try:
            existing_indexes = [idx.name for idx in self.pc.list_indexes()]
            if self.index_name not in existing_indexes:
                logger.info(f"Creating Pinecone index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
                )
        except Exception as e:
            logger.warning(f"Could not verify/create Pinecone index: {e}")

    def add_documents(self, docs: List[Document], namespace: str) -> int:
        if not docs:
            return 0
        embeddings = self.get_embeddings()
        if not embeddings:
            raise RuntimeError("Embeddings service unavailable. Verify Google API keys.")

        store = PineconeVectorStore(
            index_name=self.index_name,
            embedding=embeddings,
            namespace=namespace
        )
        batch_size = 30
        for i in range(0, len(docs), batch_size):
            batch = docs[i : i + batch_size]
            store.add_documents(batch)
        return len(docs)

    @telemetry.observe(as_type="retriever", name="vector_similarity_search")
    def similarity_search(
        self,
        query: str,
        namespace: str,
        k: int = 6,
        document_ids: Optional[List[str]] = None
    ) -> List[Document]:
        embeddings = self.get_embeddings()
        if not embeddings:
            return []

        store = PineconeVectorStore(
            index_name=self.index_name,
            embedding=embeddings,
            namespace=namespace
        )

        filter_dict = {}
        if document_ids:
            if len(document_ids) == 1:
                filter_dict = {"document_id": document_ids[0]}
            else:
                filter_dict = {"document_id": {"$in": document_ids}}

        try:
            if filter_dict:
                return store.similarity_search(query, k=k, filter=filter_dict)
            return store.similarity_search(query, k=k)
        except Exception as e:
            logger.error(f"Pinecone similarity search error: {e}")
            return []

    def delete_document_vectors(self, document_id: str, namespace: str):
        if not self.pc or not self.index_name:
            return
        try:
            index = self.pc.Index(self.index_name)
            index.delete(filter={"document_id": document_id}, namespace=namespace)
        except Exception as e:
            logger.warning(f"Pinecone vectors deletion warning for doc {document_id}: {e}")

vector_service = VectorService()
