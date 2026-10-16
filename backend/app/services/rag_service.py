import re
import math
from typing import List, Dict, Any, Optional, Tuple
from langchain_core.documents import Document
from app.services.vector_service import vector_service
from app.services.web_search_service import web_search_service
from app.core.database import get_db_conn
from app.api.models import Citation

class RAGService:
    def __init__(self):
        self.rrf_k = 60

    def _keyword_search_db(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        limit: int = 6
    ) -> List[Document]:
        """
        Lightweight full-text keyword retrieval on user's documents as part of hybrid search.
        """
        terms = [t for t in re.findall(r'\w+', query.lower()) if len(t) > 2]
        if not terms:
            return []

        conn = get_db_conn()
        cur = conn.cursor()
        
        doc_filter_sql = ""
        params = [user_id]
        if document_ids:
            doc_filter_sql = " AND id = ANY(%s)"
            params.append(document_ids)

        cur.execute(
            f"SELECT id, filename, full_text FROM documents WHERE user_id = %s {doc_filter_sql}",
            tuple(params)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        scored_chunks: List[Tuple[float, Document]] = []
        for doc_id, filename, full_text in rows:
            if not full_text:
                continue
            # Break text into paragraphs
            paragraphs = [p.strip() for p in full_text.split("\n\n") if len(p.strip()) > 30]
            for p_idx, para in enumerate(paragraphs[:80]):
                score = 0
                lower_p = para.lower()
                for term in terms:
                    if term in lower_p:
                        score += 1.0 + (lower_p.count(term) * 0.2)
                if score > 0:
                    scored_chunks.append((
                        score,
                        Document(
                            page_content=para[:900],
                            metadata={
                                "user_id": user_id,
                                "document_id": doc_id,
                                "filename": filename,
                                "page": 1,
                                "chunk_id": f"kw_{doc_id}_{p_idx}"
                            }
                        )
                    ))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_chunks[:limit]]

    def hybrid_retrieve(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 6
    ) -> List[Document]:
        """
        Performs Hybrid Search using Pinecone vector retrieval + BM25-style keyword search,
        combined with Reciprocal Rank Fusion (RRF).
        """
        # 1. Vector Search
        vector_docs = vector_service.similarity_search(
            query=query,
            namespace=user_id,
            k=top_k * 2,
            document_ids=document_ids
        )

        # 2. Keyword Search
        keyword_docs = self._keyword_search_db(
            query=query,
            user_id=user_id,
            document_ids=document_ids,
            limit=top_k * 2
        )

        if not vector_docs and not keyword_docs:
            return []

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores: Dict[str, float] = {}
        doc_map: Dict[str, Document] = {}

        for rank, doc in enumerate(vector_docs):
            key = doc.metadata.get("chunk_id") or doc.page_content[:100]
            doc_map[key] = doc
            rrf_scores[key] = rrf_scores.get(key, 0.0) + (1.0 / (self.rrf_k + rank + 1))

        for rank, doc in enumerate(keyword_docs):
            key = doc.metadata.get("chunk_id") or doc.page_content[:100]
            doc_map[key] = doc
            rrf_scores[key] = rrf_scores.get(key, 0.0) + (1.0 / (self.rrf_k + rank + 1))

        # Sort by merged RRF score
        sorted_keys = sorted(rrf_scores.keys(), key=lambda k: rrf_scores[k], reverse=True)
        return [doc_map[k] for k in sorted_keys[:top_k]]

    def assemble_rag_context(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        enable_web_search: bool = True
    ) -> Tuple[str, List[Citation]]:
        """
        Assembles hybrid document evidence and web search results into unified context
        along with structured citations.
        """
        citations: List[Citation] = []
        context_parts: List[str] = []

        # 1. Document retrieval
        doc_chunks = self.hybrid_retrieve(
            query=query,
            user_id=user_id,
            document_ids=document_ids,
            top_k=6
        )

        if doc_chunks:
            context_parts.append("### USER DOCUMENTS EVIDENCE:")
            for idx, doc in enumerate(doc_chunks, start=1):
                fname = doc.metadata.get("filename", "Document")
                page = doc.metadata.get("page", 1)
                text = doc.page_content.strip()

                context_parts.append(
                    f"[[DOCUMENT_REF_{idx}]] File: {fname} (Page {page}):\n{text}"
                )
                citations.append(
                    Citation(
                        title=f"{fname} (Page {page})",
                        page=page,
                        snippet=text[:250],
                        type="doc"
                    )
                )

        # 2. Web search retrieval
        if enable_web_search:
            web_results = web_search_service.search(query=query, max_results=4)
            if web_results:
                context_parts.append("\n### REAL-TIME WEB SEARCH EVIDENCE:")
                for idx, item in enumerate(web_results, start=1):
                    w_title = item.get("title", "Web Source")
                    w_url = item.get("url", "")
                    w_snippet = item.get("snippet", "")
                    context_parts.append(
                        f"[[WEB_REF_{idx}]] Title: {w_title}\nURL: {w_url}\nSnippet: {w_snippet}"
                    )
                    citations.append(
                        Citation(
                            title=w_title,
                            url=w_url,
                            snippet=w_snippet[:250],
                            type="web"
                        )
                    )

        full_context = "\n\n".join(context_parts) if context_parts else "No specific documents or web results found."
        return full_context, citations

rag_service = RAGService()
