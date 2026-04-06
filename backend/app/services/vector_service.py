from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.core.config import settings

class VectorService:
    def __init__(self):
        try:
            self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            self.index_name = settings.PINECONE_INDEX_NAME
            self.initialized = True
            self.ensure_index()
        except Exception as e:
            print(f"CRITICAL WARNING: Pinecone initialization failed. RAG features will be disabled. Error: {e}")
            self.pc = None
            self.index_name = None
            self.initialized = False
        
        # We need at least one valid key to initialize embeddings
        keys = settings.get_google_api_keys()
        if not keys:
            print("WARNING: No Google API keys found!")
            self.embeddings = None
        else:
            try:
                self.embeddings = GoogleGenerativeAIEmbeddings(
                    model="gemini-embedding-001",
                    task_type="retrieval_document",
                    output_dimensionality=1024,
                    google_api_key=keys[0]
                )
            except Exception as e:
                print(f"WARNING: Google Embeddings failed to initialize: {e}")
                self.embeddings = None
            
        if self.initialized:
            self.vector_db = PineconeVectorStore(
                index_name=self.index_name,
                embedding=self.embeddings,
            )
        else:
            self.vector_db = None

    def ensure_index(self):
        if not self.initialized: return
        try:
            if self.index_name not in self.pc.list_indexes().names():
                print("Creating Pinecone index...")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=1024,
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
                )
        except Exception as e:
            print(f"WARNING: Could not check/create Pinecone index: {e}")
            self.initialized = False
            
    def get_namespace_retriever(self, namespace: str, document_id: str, k: int = 6):
        ns_vector_db = PineconeVectorStore(
            index_name=self.index_name,
            embedding=self.embeddings,
            namespace=namespace,
        )
        return ns_vector_db.as_retriever(
            search_kwargs={
                "k": k,
                "filter": {"document_id": document_id},
            }
        )


vector_service = VectorService()
