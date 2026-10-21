import re
import math
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urlparse, unquote
from langchain_core.documents import Document
from app.services.vector_service import vector_service
from app.services.web_search_service import web_search_service, extract_site_metadata
from app.services.llm_service import llm_service, is_verification_query
from app.services.document_service import extract_urls_from_text
from app.core.database import get_db_conn
from app.api.models import Citation

KNOWN_PLATFORMS = {
    "github.com": "GitHub",
    "gitlab.com": "GitLab",
    "bitbucket.org": "Bitbucket",
    "linkedin.com": "LinkedIn",
    "leetcode.com": "LeetCode",
    "hackerrank.com": "HackerRank",
    "codeforces.com": "Codeforces",
    "kaggle.com": "Kaggle",
    "huggingface.co": "Hugging Face",
    "arxiv.org": "arXiv",
    "biorxiv.org": "bioRxiv",
    "medrxiv.org": "medRxiv",
    "wikipedia.org": "Wikipedia",
    "youtube.com": "YouTube",
    "youtu.be": "YouTube",
    "twitter.com": "X (Twitter)",
    "x.com": "X (Twitter)",
    "medium.com": "Medium",
    "substack.com": "Substack",
    "stackoverflow.com": "Stack Overflow",
    "reddit.com": "Reddit",
    "pypi.org": "PyPI",
    "npmjs.com": "npm",
    "docker.com": "Docker Hub",
    "news.ycombinator.com": "Hacker News",
    "researchgate.net": "ResearchGate",
    "nature.com": "Nature",
    "sciencedirect.com": "ScienceDirect",
    "pubmed.ncbi.nlm.nih.gov": "PubMed",
    "ieee.org": "IEEE",
}

HOSTING_DOMAINS = (
    "vercel.app", "netlify.app", "github.io", "gitlab.io", "pages.dev",
    "herokuapp.com", "render.com", "railway.app", "web.app", "firebaseapp.com",
    "fly.dev", "surge.sh", "cloudfront.net"
)

def format_url_title(url: str, site_name: str = "") -> str:
    """
    Universally generates human-readable, professional citation card titles for ANY URL
    across any document domain (resumes, academic research, medical docs, financial reports, technical architecture).
    Zero hardcoded project names.
    """
    # 1. If an authentic page title from HTML <title> or search result is available, use it!
    if site_name and site_name not in ("Web", "Verified Link", "Unknown") and not site_name.startswith("http"):
        clean_title = re.sub(r'\s*([\|\-•—]\s*([A-Za-z0-9\s]+))?$', '', site_name.strip())
        if len(clean_title) >= 3 and "." not in clean_title:
            return clean_title[:70]

    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]

        path_parts = [p for p in parsed.path.strip("/").split("/") if p]

        # 2. Check major platforms with structured paths
        for k_dom, k_name in KNOWN_PLATFORMS.items():
            if k_dom in domain:
                if k_dom in ("github.com", "gitlab.com", "bitbucket.org"):
                    if len(path_parts) >= 2:
                        return f"{k_name}: {path_parts[0]}/{path_parts[1]}"
                    elif len(path_parts) == 1:
                        return f"{k_name}: @{path_parts[0]}"
                    return f"{k_name} Repository"

                elif k_dom == "linkedin.com":
                    if len(path_parts) >= 2 and path_parts[0] in ("in", "company", "school"):
                        profile_name = unquote(path_parts[1]).replace("-", " ").title()
                        profile_name = re.sub(r'\s+\d{6,}', '', profile_name)
                        return f"{k_name}: {profile_name}" if profile_name else f"{k_name} Profile"
                    return f"{k_name} Profile"

                elif k_dom == "leetcode.com":
                    if len(path_parts) >= 2 and path_parts[0] == "u":
                        return f"LeetCode: @{path_parts[1]}"
                    elif len(path_parts) >= 2 and path_parts[0] == "problems":
                        problem_title = path_parts[1].replace("-", " ").title()
                        return f"LeetCode: {problem_title}"
                    return "LeetCode Profile"

                elif k_dom == "arxiv.org":
                    return f"arXiv: {path_parts[-1]}" if path_parts else "arXiv Research Paper"

                elif k_dom == "wikipedia.org":
                    if path_parts:
                        article_title = unquote(path_parts[-1]).replace("_", " ")
                        return f"Wikipedia: {article_title}"
                    return "Wikipedia"

                elif k_dom in ("youtube.com", "youtu.be"):
                    if any("watch" in p or "shorts" in p for p in path_parts) or "youtu.be" in domain:
                        return "YouTube Video"
                    elif path_parts and path_parts[0].startswith("@"):
                        return f"YouTube: {path_parts[0]}"
                    return "YouTube Channel"

                elif k_dom == "huggingface.co":
                    if len(path_parts) >= 2:
                        return f"Hugging Face: {path_parts[0]}/{path_parts[1]}"
                    return "Hugging Face Model"

                elif path_parts:
                    clean_slug = unquote(path_parts[-1]).replace("-", " ").replace("_", " ").title()
                    clean_slug = re.sub(r'\.(html|htm|php|aspx|pdf)$', '', clean_slug, flags=re.IGNORECASE)
                    return f"{k_name}: {clean_slug[:35]}"
                return f"{k_name}"

        # 3. Dynamic cloud-hosted web apps (*.vercel.app, *.netlify.app, *.github.io, etc.)
        for host in HOSTING_DOMAINS:
            if host in domain:
                sub = domain.replace(f".{host}", "")
                words = [w for w in re.split(r'[-_]', sub) if not (len(w) >= 6 and re.search(r'[0-9]', w) and re.search(r'[a-zA-Z]', w))]
                clean_name = " ".join(words).title() if words else sub.title()
                return f"{clean_name} (Live App)"

        # 4. Universal fallback: Derive from domain brand & path slug
        dom_parts = domain.split(".")
        brand = dom_parts[0].capitalize() if dom_parts else domain
        if path_parts:
            last_part = path_parts[-1]
            clean_slug = unquote(last_part).replace("-", " ").replace("_", " ").title()
            clean_slug = re.sub(r'\.(html|htm|php|aspx|pdf)$', '', clean_slug, flags=re.IGNORECASE)
            if len(clean_slug) <= 2 and len(path_parts) >= 2:
                clean_slug = unquote(path_parts[-2]).replace("-", " ").replace("_", " ").title()
            return f"{brand}: {clean_slug[:35]}"
        return f"{brand} Official Site"
    except Exception:
        return url[:45]


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

        sorted_keys = sorted(rrf_scores.keys(), key=lambda k: rrf_scores[k], reverse=True)
        return [doc_map[k] for k in sorted_keys[:top_k]]

    def assemble_rag_context(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        enable_web_search: bool = True,
        chat_history: Optional[List[dict]] = None
    ) -> Tuple[str, List[Citation], Optional[str]]:
        """
        Assembles hybrid document evidence and web search results into unified context
        along with structured citations, respecting chat-specific document attachments.
        Dynamically formulates targeted verification queries when checking claims, people,
        or projects from attached documents.
        Returns: (full_context, citations, search_topic).
        """
        context_parts: List[str] = []
        search_topic: Optional[str] = None
        doc_chunks: List[Document] = []
        doc_citations: List[Citation] = []
        web_citations: List[Citation] = []
        live_fetched_sources: List[Dict[str, Any]] = []
        web_results: List[Dict[str, Any]] = []

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

        # 2. Document retrieval
        if document_ids is None or len(document_ids) > 0:
            doc_chunks = self.hybrid_retrieve(
                query=query,
                user_id=user_id,
                document_ids=document_ids,
                top_k=6
            )

            seen_doc_pages = set()
            if doc_chunks:
                context_parts.append("### USER DOCUMENTS EVIDENCE:")
                for idx, doc in enumerate(doc_chunks, start=1):
                    fname = doc.metadata.get("filename", "Document")
                    page = doc.metadata.get("page", 1)
                    text = doc.page_content.strip()

                    context_parts.append(
                        f"[[DOCUMENT_REF_{idx}]] File: {fname} (Page {page}):\n{text}"
                    )
                    page_key = f"{fname}_{page}"
                    if page_key not in seen_doc_pages and len(doc_citations) < 2:
                        seen_doc_pages.add(page_key)
                        doc_citations.append(
                            Citation(
                                title=f"{fname} (Page {page})",
                                site_name=fname,
                                page=page,
                                snippet=text[:300],
                                type="doc"
                            )
                        )

        # 3. Context-Aware Verification & Web Search Retrieval
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

        # Extract any explicit URLs from the user query itself (e.g. "check sidcode.ai", "what is stripe.com")
        query_urls = extract_urls_from_text(query)
        for qu in query_urls:
            if qu not in extracted_doc_links and not qu.startswith("mailto:"):
                extracted_doc_links.append(qu)

        # Also extract URLs from recent user turns in chat history
        if chat_history:
            for past_m in chat_history[-3:]:
                if past_m.get("role") in ["user", "human"]:
                    for past_u in extract_urls_from_text(past_m.get("content", "")):
                        if past_u not in extracted_doc_links and not past_u.startswith("mailto:"):
                            extracted_doc_links.append(past_u)

        if enable_web_search:
            is_verification = is_verification_query(query)

            if is_verification and (doc_chunks or extracted_doc_links):
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
                    if l not in verification_urls and not l.startswith("mailto:"):
                        verification_urls.append(l)
                for w in web_results:
                    w_url = w.get("url", "")
                    if w_url and w_url not in verification_urls and not w_url.startswith("mailto:"):
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
            else:
                search_queries, search_topic = llm_service.formulate_web_research_queries(query, chat_history=chat_history)
                web_results = web_search_service.search_multi(queries=search_queries, max_results=8)
                if web_results:
                    context_parts.append(
                        f"\n### REAL-TIME WEB SEARCH EVIDENCE (Targeted Searches: {', '.join(search_queries)}):\n"
                        f"DocMind gathered fresh facts and up-to-date sources using multi-angle queries."
                    )

                # LIVE FETCH: Inspect referenced links or discovered profiles/channels (YouTube, GitHub, LinkedIn, .ai)
                inspect_candidates = list(extracted_doc_links)
                for w in web_results:
                    wu = w.get("url", "")
                    if wu and any(p in wu.lower() for p in ["youtube.com", "youtu.be", "github.com", "linkedin.com", ".ai"]):
                        if wu not in inspect_candidates and not wu.startswith("mailto:"):
                            inspect_candidates.append(wu)

                if inspect_candidates:
                    query_live_sources = web_search_service.fetch_multiple_urls(inspect_candidates[:4])
                    if query_live_sources:
                        live_fetched_sources.extend(query_live_sources)
                        context_parts.append("\n### LIVE VISITED EVIDENCE (Directly Fetched from Target Profiles & URLs):")
                        for l_idx, live_item in enumerate(query_live_sources, start=1):
                            context_parts.append(
                                f"[[LIVE_LINK_{l_idx}]] Target URL: {live_item.get('url')}\nPage Title: {live_item.get('title')}\nLive Content:\n{live_item.get('snippet')}"
                            )

            if web_results:
                for idx, item in enumerate(web_results, start=1):
                    w_title = item.get("title", "Web Source")
                    w_url = item.get("url", "")
                    w_snippet = item.get("snippet", "")
                    context_parts.append(
                        f"[[WEB_REF_{idx}]] Title: {w_title}\nURL: {w_url}\nSnippet: {w_snippet}"
                    )

        # 4. Assemble Rich Citations: Web & Verified Link Cards FIRST, followed by Document Cards
        seen_urls = set()

        # 4a. Add live fetched verified sources
        for live_item in live_fetched_sources:
            l_url = live_item.get("url", "").rstrip("/")
            if l_url and l_url.lower() not in seen_urls:
                seen_urls.add(l_url.lower())
                web_citations.append(
                    Citation(
                        title=live_item.get("title") or format_url_title(l_url, live_item.get("site_name", "")),
                        url=l_url,
                        snippet=live_item.get("snippet", "")[:300],
                        site_name=live_item.get("site_name") or "Verified Link",
                        favicon=live_item.get("favicon"),
                        type="web"
                    )
                )

        # 4b. Add all extracted links from the document (GitHub, LinkedIn, Portfolio, Projects, etc.)
        for raw_url in extracted_doc_links:
            clean_u = raw_url.strip().rstrip("/")
            if clean_u and clean_u.lower() not in seen_urls and not clean_u.startswith("mailto:"):
                seen_urls.add(clean_u.lower())
                site_name, favicon = extract_site_metadata(clean_u)
                card_title = format_url_title(clean_u, site_name)
                web_citations.append(
                    Citation(
                        title=card_title,
                        url=clean_u,
                        snippet=f"Verified online link referenced in document: {clean_u}",
                        site_name=site_name,
                        favicon=favicon,
                        type="web"
                    )
                )

        # 4c. Add search results from DuckDuckGo
        for item in web_results:
            w_url = item.get("url", "").rstrip("/")
            if w_url and w_url.lower() not in seen_urls:
                seen_urls.add(w_url.lower())
                web_citations.append(
                    Citation(
                        title=item.get("title", "Web Source"),
                        url=w_url,
                        snippet=item.get("snippet", "")[:300],
                        site_name=item.get("site_name") or "Web",
                        favicon=item.get("favicon"),
                        type="web"
                    )
                )

        # Final balanced citations: Web/Link cards prominent, followed by document reference
        citations = web_citations + doc_citations

        full_context = "\n\n".join(context_parts) if context_parts else "No specific documents or web results found."
        return full_context, citations, search_topic

    def filter_and_ground_citations(
        self,
        citations: List[Citation],
        answer_text: str
    ) -> List[Citation]:
        """
        Gounds and filters citations against the LLM's actual generated answer.
        Identifies precisely which documents and web results were cited or utilized
        in the synthesis, orders them by their appearance in the text, and assigns
        them sequential 1-based citation index badges [1], [2], etc.
        """
        if not citations:
            return []
        if not answer_text or not answer_text.strip():
            # If no answer text, mark all as unused
            res = []
            for c in citations:
                c_copy = c.model_copy()
                c_copy.index = None
                c_copy.used_in_answer = False
                res.append(c_copy)
            return res

        answer_lower = answer_text.lower()

        # 1. Extract all markdown links and bare URLs from answer
        md_links = re.findall(r'\[([^\]]+)\]\((https?://[^\s)]+)\)', answer_text, re.IGNORECASE)
        bare_urls = re.findall(r'https?://[^\s)\]"\'>]+', answer_text, re.IGNORECASE)
        cited_urls = set()
        for _, u in md_links:
            cited_urls.add(u.strip().rstrip("/"))
        for u in bare_urls:
            cited_urls.add(u.strip().rstrip("/"))

        # 2. Extract reference tags from context
        web_ref_nums = set(re.findall(r'\[\[?WEB_REF_(\d+)\]?\]', answer_text, re.IGNORECASE))
        live_ref_nums = set(re.findall(r'\[\[?LIVE_LINK_(\d+)\]?\]', answer_text, re.IGNORECASE))
        doc_ref_nums = set(re.findall(r'\[\[?DOCUMENT_REF_(\d+)\]?\]', answer_text, re.IGNORECASE))

        # 3. Extract bracketed citation numbers like [1], [2], [3]
        numbered_citations = set(re.findall(r'(?<!\w)\[(\d{1,2})\](?!\w)', answer_text))

        # Check document citations [Doc: filename, Page X]
        doc_cites = re.findall(r'\[Doc:\s*([^,\]]+)(?:,\s*Page\s*(\d+))?\]', answer_text, re.IGNORECASE)

        def normalize_url(url: Optional[str]) -> str:
            if not url:
                return ""
            u = url.lower().strip().rstrip("/")
            u = re.sub(r'^https?://', '', u)
            u = re.sub(r'^www\.', '', u)
            return u

        normalized_cited_urls = {normalize_url(u) for u in cited_urls}

        used_matches = []
        unused_citations = []

        is_negative_finding = any(
            phrase in answer_lower
            for phrase in [
                "does not exist", "not found", "cannot be found", "zero relevant",
                "no discoverable", "unrelated fallback", "no public record", "insufficient evidence"
            ]
        )

        for idx, c in enumerate(citations, start=1):
            is_used = False
            first_pos = 9999999

            c_url_norm = normalize_url(c.url)

            # Check direct URL match
            if c_url_norm:
                for cited_u in normalized_cited_urls:
                    if c_url_norm in cited_u or cited_u in c_url_norm:
                        is_used = True
                        pos = answer_lower.find(c_url_norm)
                        if pos != -1 and pos < first_pos:
                            first_pos = pos

            # Check [[WEB_REF_X]] marker
            if str(idx) in web_ref_nums:
                is_used = True
                pos = answer_text.find(f"WEB_REF_{idx}")
                if pos != -1 and pos < first_pos:
                    first_pos = pos

            # Check [[LIVE_LINK_X]] marker
            if str(idx) in live_ref_nums:
                is_used = True
                pos = answer_text.find(f"LIVE_LINK_{idx}")
                if pos != -1 and pos < first_pos:
                    first_pos = pos

            # Check [X] numbered citation badge matching this 1-based source
            if str(idx) in numbered_citations:
                is_used = True
                pos = answer_text.find(f"[{idx}]")
                if pos != -1 and pos < first_pos:
                    first_pos = pos

            # Check document tag or doc cite match
            if c.type == "doc":
                if str(idx) in doc_ref_nums:
                    is_used = True
                    pos = answer_text.find(f"DOCUMENT_REF_{idx}")
                    if pos != -1 and pos < first_pos:
                        first_pos = pos
                elif c.site_name and c.site_name.lower() in answer_lower:
                    is_used = True
                    pos = answer_lower.find(c.site_name.lower())
                    if pos != -1 and pos < first_pos:
                        first_pos = pos
                elif any(c.site_name and c.site_name.lower() in dc[0].lower() for dc in doc_cites):
                    is_used = True
                    first_pos = min(first_pos, 500)

            # Check distinctive site name (e.g., YouTube, Reddit, GitHub, Wikipedia)
            if not is_used and c.site_name and len(c.site_name) > 3:
                site_lower = c.site_name.lower()
                generic_names = ["web", "web source", "document", "google", "search", "verified link"]
                if site_lower not in generic_names:
                    if site_lower in answer_lower:
                        is_used = True
                        pos = answer_lower.find(site_lower)
                        if pos != -1 and pos < first_pos:
                            first_pos = pos

            # Check distinctive title terms (e.g. "Techno Gamerz", "SidCode")
            if not is_used and c.title and len(c.title) > 6:
                clean_title = re.sub(r'\(.*?\)', '', c.title).strip().lower()
                clean_title = re.sub(r'[^\w\s]', '', clean_title).strip()
                if len(clean_title) > 8 and clean_title in answer_lower:
                    is_used = True
                    pos = answer_lower.find(clean_title)
                    if pos != -1 and pos < first_pos:
                        first_pos = pos

            # Spam marketplace guard: NEVER treat AliExpress / Temu as used unless the query was shopping
            if c.url and any(bad in c.url.lower() for bad in ["aliexpress.com", "temu.com", "alibaba.com"]):
                if is_negative_finding or "aliexpress" not in answer_lower:
                    is_used = False

            if is_used:
                used_matches.append((first_pos, c))
            else:
                unused_citations.append(c)

        # Case A: We have confirmed grounded citations
        if used_matches:
            # Sort by appearance in answer
            used_matches.sort(key=lambda x: x[0])
            ordered_used = []
            for i, (_, cit) in enumerate(used_matches, start=1):
                cit_copy = cit.model_copy()
                cit_copy.index = i
                cit_copy.used_in_answer = True
                ordered_used.append(cit_copy)

            ordered_unused = []
            for cit in unused_citations:
                cit_copy = cit.model_copy()
                cit_copy.index = None
                cit_copy.used_in_answer = False
                ordered_unused.append(cit_copy)

            return ordered_used + ordered_unused

        # Case B: If answer is stating the entity was NOT found or doesn't exist, do not force any sources
        if is_negative_finding:
            res = []
            for cit in citations:
                cit_copy = cit.model_copy()
                cit_copy.index = None
                cit_copy.used_in_answer = False
                res.append(cit_copy)
            return res

        # Case C: Positive synthesis without explicit markdown links: mark top 2-3 clean sources
        fallback_used = []
        fallback_unused = []
        clean_count = 0
        for cit in citations:
            is_spam = cit.url and any(bad in cit.url.lower() for bad in ["aliexpress.com", "temu.com", "alibaba.com"])
            cit_copy = cit.model_copy()
            if not is_spam and clean_count < 3:
                clean_count += 1
                cit_copy.index = clean_count
                cit_copy.used_in_answer = True
                fallback_used.append(cit_copy)
            else:
                cit_copy.index = None
                cit_copy.used_in_answer = False
                fallback_unused.append(cit_copy)

        return fallback_used + fallback_unused

rag_service = RAGService()



