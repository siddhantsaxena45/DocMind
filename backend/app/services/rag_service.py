import re
import math
from typing import List, Dict, Any, Optional, Tuple
from langchain_core.documents import Document
from app.services.vector_service import vector_service
from app.services.web_search_service import web_search_service
from app.services.llm_service import llm_service, is_verification_query
from app.services.document_service import extract_urls_from_text
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
        Strictly limits search to `document_ids` if provided. If document_ids is an empty list,
        returns no documents.
        """
        # If an empty list of document_ids is provided, this chat has 0 documents attached
        if document_ids is not None and len(document_ids) == 0:
            return []

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
    ) -> Tuple[str, List[Citation], Optional[str]]:
        """
        Assembles hybrid document evidence and web search results into unified context
        along with structured citations, respecting chat-specific document attachments.
        Dynamically formulates targeted verification queries when checking claims, people,
        or projects from attached documents.
        Returns: (full_context, citations, search_topic).
        """
        citations: List[Citation] = []
        context_parts: List[str] = []
        search_topic: Optional[str] = None
        doc_chunks: List[Document] = []

        # 1. Inspect attached documents for this chat
        attached_docs_summary = []
        if document_ids:
            try:
                conn = get_db_conn()
                cur = conn.cursor()
                cur.execute(
                    "SELECT id, filename, file_type FROM documents WHERE user_id = %s AND id = ANY(%s)",
                    (user_id, document_ids)
                )
                rows = cur.fetchall()
                cur.close()
                conn.close()
                attached_docs_summary = [f"{r[1]} ({r[2]})" for r in rows]
            except Exception:
                attached_docs_summary = []

        if attached_docs_summary:
            context_parts.append(
                f"### THIS CHAT'S PERSONAL KNOWLEDGE BASE (ATTACHED DOCUMENTS):\n"
                f"Active files: {', '.join(attached_docs_summary)}\n"
                f"Note: Only the documents listed above belong to this chat's knowledge base."
            )
        elif document_ids is not None and len(document_ids) == 0:
            context_parts.append(
                "### THIS CHAT'S PERSONAL KNOWLEDGE BASE:\n"
                "No documents are attached to this conversation. "
                "If the user asks questions regarding any documents, reports, or files, state that "
                "no documents are attached to this chat and prompt them to attach or upload documents using the Paperclip / Attach button."
            )

        # 2. Document retrieval (only if document_ids is None or contains IDs)
        if document_ids is None or len(document_ids) > 0:
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
                            site_name=fname,
                            page=page,
                            snippet=text[:300],
                            type="doc"
                        )
                    )

        # 3. Context-Aware Verification & Web Search Retrieval
        if enable_web_search:
            web_results: List[Dict[str, Any]] = []
            is_verification = is_verification_query(query)

            # Collect any embedded URLs present in retrieved document chunks and full_text
            extracted_doc_links: List[str] = []
            if doc_chunks:
                for doc in doc_chunks:
                    for u in extract_urls_from_text(doc.page_content):
                        if u not in extracted_doc_links:
                            extracted_doc_links.append(u)

            if document_ids:
                try:
                    c_conn = get_db_conn()
                    c_cur = c_conn.cursor()
                    c_cur.execute(
                        "SELECT full_text FROM documents WHERE user_id = %s AND id = ANY(%s)",
                        (user_id, document_ids)
                    )
                    for f_row in c_cur.fetchall():
                        if f_row[0]:
                            for u in extract_urls_from_text(f_row[0]):
                                if u not in extracted_doc_links:
                                    extracted_doc_links.append(u)
                    c_cur.close()
                    c_conn.close()
                except Exception:
                    pass

            if is_verification and (doc_chunks or extracted_doc_links):
                # Formulation of targeted search queries using candidate/project/company entities from document
                doc_preview = "\n\n".join(doc.page_content for doc in doc_chunks[:3])
                targeted_queries, search_topic = llm_service.formulate_verification_queries(
                    query=query,
                    doc_context=doc_preview,
                    extracted_links=extracted_doc_links
                )
                web_results = web_search_service.search_multi(targeted_queries, max_results=8)
                if web_results:
                    context_parts.append(
                        f"\n### REAL-TIME VERIFICATION SEARCH EVIDENCE (Targeted Searches: {', '.join(targeted_queries)}):\n"
                        f"DocMind investigated online presence, official profiles, and claims using targeted entity queries."
                    )

                # DEEP LIVE LINK INSPECTION: Directly visit and fetch content from document links & discovered profiles
                verification_urls = []
                for l in extracted_doc_links:
                    if l not in verification_urls:
                        verification_urls.append(l)
                for w in web_results:
                    w_url = w.get("url", "")
                    if any(dom in w_url.lower() for dom in ["github.com", "linkedin.com", "leetcode.com", "sidcode.ai", "vercel.app", "portfolio"]):
                        if w_url not in verification_urls:
                            verification_urls.append(w_url)

                if verification_urls:
                    live_fetched_sources = web_search_service.fetch_multiple_urls(verification_urls[:4])
                    if live_fetched_sources:
                        context_parts.append(
                            "\n### LIVE VERIFIED EVIDENCE (Directly Fetched from Document Links & Online Profiles):\n"
                            "DocMind directly visited the live web pages to check if the claims in the document match what is live:"
                        )
                        for l_idx, live_item in enumerate(live_fetched_sources, start=1):
                            l_url = live_item.get("url", "")
                            l_title = live_item.get("title", "")
                            l_snippet = live_item.get("snippet", "")
                            context_parts.append(
                                f"[[LIVE_LINK_{l_idx}]] Target URL: {l_url}\nPage Title: {l_title}\nLive Content:\n{l_snippet}"
                            )
                            if not any(c.url == l_url for c in citations):
                                citations.insert(0, Citation(
                                    title=l_title,
                                    url=l_url,
                                    snippet=l_snippet[:300],
                                    site_name=live_item.get("site_name") or "Verified Link",
                                    favicon=live_item.get("favicon"),
                                    type="web"
                                ))
            else:
                # Normal web search: distill clean topic to avoid conversational filler
                search_topic = llm_service.extract_research_query(query)
                search_q = search_topic if search_topic and len(search_topic) < len(query) else query
                web_results = web_search_service.search(query=search_q, max_results=6)
                if web_results:
                    context_parts.append("\n### REAL-TIME WEB SEARCH EVIDENCE:")

            if web_results:
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
                            snippet=w_snippet[:300],
                            site_name=item.get("site_name") or "Web",
                            favicon=item.get("favicon"),
                            type="web"
                        )
                    )

        full_context = "\n\n".join(context_parts) if context_parts else "No specific documents or web results found."
        return full_context, citations, search_topic

rag_service = RAGService()

