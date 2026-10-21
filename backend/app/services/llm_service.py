from datetime import datetime, timezone
import logging
import json
import re
from typing import List, AsyncGenerator, Optional, Tuple, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from app.core.config import settings, api_key_rotator

logger = logging.getLogger(__name__)

def get_system_prompt() -> str:
    now = datetime.now(timezone.utc)
    current_date_str = now.strftime("%A, %B %d, %Y")
    current_year = now.year

    return f"""You are DocMind AI, a state-of-the-art Research and Document Intelligence Assistant.

TEMPORAL CONTEXT & CURRENT DATE:
- Today's date is {current_date_str}. The current year is {current_year}.
- You must always maintain rigorous temporal awareness relative to today ({current_date_str}).
- When answering questions about current events, wealth, net worth, subscriber counts, technology, or public figures:
  * Prioritize the most recent information ({current_year} and late {current_year - 1}).
  * If web citations or public estimates are from an earlier year (such as 2024 or 2025), EXPLICITLY specify the year of that data (e.g. "According to reports published in 2024, ...") and clarify that subsequent growth has occurred since then.
  * NEVER present 2024 or older data as if it represents current statistics for {current_year}.

Your purpose is to answer the user's questions with exceptional precision, analytical depth, and clarity, drawing upon the provided Document Evidence and Real-Time Web Search Evidence.

CORE OPERATIONAL RULES:
1. CITATIONS & GROUNDING:
   - Always substantiate factual claims with inline references to the source material.
   - When citing documents, cite accurately: `[Doc: <filename>, Page <X>]`.
   - When citing web sources, cite with markdown links: `[<Title>](<URL>)`.
   - NEVER fabricate or extrapolate citations that are not in the provided context.
   - If the provided document and web evidence does not contain enough information to answer definitively, explicitly state: "Based on the provided documents and web search, there is insufficient evidence to confirm..." and explain what is known.

2. PRESENTATION & FORMATTING (PERPLEXITY-STYLE):
   - Produce beautifully formatted Markdown:
     * Start with a direct, comprehensive overview paragraph answering the core question.
     * When comparing entities, platforms, options, metrics, or financial breakdowns, ALWAYS format the comparison using a rich Markdown table:
       | Metric / Feature | Option A | Option B |
       | :--- | :--- | :--- |
     * Highlight key data points and figures in bold (e.g., **95/5**, **55% ad share**, **Weekly**).
     * Use descriptive sub-headings (##, ###) to segment themes logically.
     * Use clean bullet points for multi-part breakdowns (e.g., `• On YouTube: ...`, `• On Kick: ...`).
     * End comparative sections or the main summary with a clear `**Key takeaway:**` callout.
     * Format code snippets inside fenced code blocks with the correct language tag (e.g., ```python).

3. CONTEXT INTEGRATION:
   - When both document context and web context are provided, synthesize them logically.
   - You may address follow-up questions by considering the conversation history.

4. PERSONAL CHAT KNOWLEDGE BASE ISOLATION:
   - Each conversation has its own dedicated personal knowledge base containing only the documents attached to THIS chat.
   - You must ONLY reference and rely on the documents explicitly attached to this conversation (listed in the provided context).
   - If the context shows that NO documents are attached to this conversation and the user asks a question about their documents or files, politely inform them that no files are currently attached to this chat's knowledge base and encourage them to attach or upload documents using the chat's attach button.
   - Do NOT assume or hallucinate knowledge from documents that are not in this conversation's context.

5. FACT-CHECKING, LIVE LINK VERIFICATION & MATCHING:
   - When asked to verify, rate a resume, check if claims match, or investigate credentials:
   - Carefully review the "LIVE VERIFIED EVIDENCE (Directly Fetched from Document Links & Online Profiles)" and "REAL-TIME VERIFICATION SEARCH EVIDENCE" provided in the context.
   - NEVER give generic cop-outs like "I cannot independently verify his claims because I do not have access to the internet" when live link or web evidence is present.
   - Cross-examine each claim against what was verified from the live GitHub repositories, live websites, online profiles, and college records.
   - Explicitly detail which claims MATCH the live evidence (e.g. repo names matching project titles, tech stacks verified, live URLs operational).
   - Structure your response into a rigorous, professional Verification Report:
     * **Rating & Summary**: Clear rating and overview of candidate/entity.
     * **Live Inspected Links & Profiles**: Verified clickable links ([GitHub Profile](URL), [LinkedIn Profile](URL), [Live App](URL)).
     * **Claims vs Reality Verification Table**:
       | Claim in Document | Live Link / Web Evidence | Verification Status |
       | :--- | :--- | :--- |
     * **Key takeaway**: Overall credibility, confirmation of matching claims, and authenticity.
"""

def is_verification_query(query: str) -> bool:
    q = query.lower()
    terms = [
        "verify", "verification", "fact check", "factcheck", "check on internet",
        "search on internet", "search internet", "search the internet", "check online",
        "search online", "look up", "lookup", "google him", "google this", "google them",
        "background check", "is this real", "is this true", "confirm claims", "claims",
        "github", "linkedin", "portfolio", "leetcode", "credentials", "online presence",
        "on internet", "on the web", "legit", "authentic", "audit this", "who is this",
        "matching", "check claims", "verify his claims", "verify claims", "given links"
    ]
    return any(t in q for t in terms)



class LLMService:
    def _get_llm(self, api_key: str, streaming: bool = False, temperature: float = 0.3):
        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=temperature,
            google_api_key=api_key,
            streaming=streaming,
            max_output_tokens=4096
        )

    def _prepare_messages(self, query: str, chat_history: List[dict], context: str) -> List[BaseMessage]:
        messages: List[BaseMessage] = [SystemMessage(content=get_system_prompt())]

        # Add conversation history
        for item in chat_history[-10:]:
            role = item.get("role")
            content = item.get("content", "")
            if role in ["user", "human"]:
                messages.append(HumanMessage(content=content))
            elif role in ["assistant", "ai"]:
                messages.append(AIMessage(content=content))

        # Add current user prompt with context
        user_prompt_with_context = (
            f"=== RETRIEVED CONTEXT ===\n"
            f"{context}\n\n"
            f"=== USER QUERY ===\n"
            f"{query}"
        )
        messages.append(HumanMessage(content=user_prompt_with_context))
        return messages

    def generate_rag_response(self, query: str, chat_history: List[dict], context: str) -> str:
        api_keys = api_key_rotator.get_rotated_google_keys()
        if not api_keys:
            raise RuntimeError("No Google API keys available. Please check environment configuration.")

        messages = self._prepare_messages(query, chat_history, context)
        last_error = ""

        for key in api_keys:
            for attempt in range(2):
                try:
                    llm = self._get_llm(key, streaming=False)
                    response = llm.invoke(messages)
                    content = response.content
                    if isinstance(content, list):
                        content = "".join(str(part) for part in content)
                    return str(content)
                except Exception as e:
                    last_error = str(e)
                    logger.warning(f"LLM invoke attempt {attempt+1} failed with key: {last_error}")
                    if any(x in last_error for x in ["429", "RESOURCE_EXHAUSTED", "BAD_RECORD_MAC"]):
                        continue
                    break

        raise RuntimeError(f"AI response generation failed across configured keys: {last_error}")

    async def stream_rag_response(
        self,
        query: str,
        chat_history: List[dict],
        context: str
    ) -> AsyncGenerator[str, None]:
        api_keys = api_key_rotator.get_rotated_google_keys()
        if not api_keys:
            yield "Error: No Google API keys configured."
            return

        messages = self._prepare_messages(query, chat_history, context)
        last_error = ""

        for key in api_keys:
            try:
                llm = self._get_llm(key, streaming=True)
                async for chunk in llm.astream(messages):
                    content = chunk.content
                    if isinstance(content, list):
                        content = "".join(str(p) for p in content)
                    if content:
                        yield str(content)
                return
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Streaming failed with key: {last_error}. Trying next key...")
                continue

        yield f"\n\n[AI Error: Service temporarily unavailable ({last_error})]"

    def extract_research_query(self, prompt: str) -> str:
        """
        Extracts a clean, punchy 3-5 word research topic for the research status bar.
        e.g. 'Kassh Plays earnings' from 'how kick earning difft from yt how kasshplays earn on both'
        """
        cleaned = prompt.strip()
        if len(cleaned) <= 40:
            return cleaned.title()

        api_keys = api_key_rotator.get_rotated_google_keys()
        if api_keys:
            extract_prompt = (
                "Extract a concise 2 to 5 word topic of what is being researched from this user query. "
                "Do NOT use quotes or punctuation. Just the short topic phrase.\n\n"
                f"Query: {cleaned[:250]}"
            )
            for key in api_keys[:2]:
                try:
                    llm = self._get_llm(key, streaming=False, temperature=0.1)
                    res = llm.invoke([HumanMessage(content=extract_prompt)])
                    t = res.content.strip().strip('"').strip("'")
                    if t and len(t) < 50:
                        return t
                except Exception:
                    continue

        # Fast fallback heuristic
        words = re.findall(r'\b\w+\b', cleaned)
        return " ".join(words[:5]).title()

    def formulate_web_research_queries(self, query: str) -> Tuple[List[str], str]:
        """
        Generates targeted, temporally-aware search queries from the user's prompt.
        Ensures queries are optimized for freshness (current year) and keyword relevance.
        Returns (list_of_queries, display_topic).
        """
        now = datetime.now(timezone.utc)
        current_year = now.year
        clean_q = query.strip()

        api_keys = api_key_rotator.get_rotated_google_keys()
        if api_keys:
            prompt = (
                f"You are a search query optimizer. The current year is {current_year}.\n"
                f"Convert the user's conversational prompt into 2 distinct, highly effective search queries for a search engine.\n"
                f"- Query 1 should be the core keyword search for facts, background, and entities.\n"
                f"- Query 2 should be targeted for the most recent updates, current year ({current_year}), or latest statistics.\n"
                f"- Output ONLY a JSON object with this exact structure:\n"
                f'{{\n  "queries": ["keyword query 1", "recent query 2"],\n  "topic": "Concise 3-5 word topic for UI badge"\n}}\n\n'
                f"User Prompt: {clean_q}"
            )
            for key in api_keys[:2]:
                try:
                    llm = self._get_llm(key, streaming=False, temperature=0.1)
                    res = llm.invoke([HumanMessage(content=prompt)])
                    raw = res.content if isinstance(res.content, str) else str(res.content)
                    match = re.search(r'\{.*\}', raw, re.DOTALL)
                    if match:
                        data = json.loads(match.group(0))
                        queries = [str(q).strip() for q in data.get("queries", []) if str(q).strip()]
                        topic = str(data.get("topic", "")).strip() or clean_q[:40].title()
                        if queries:
                            return queries[:2], topic
                except Exception:
                    continue

        words = [w for w in re.findall(r'\b\w+\b', clean_q) if w.lower() not in ('how', 'why', 'what', 'is', 'are', 'the', 'so', 'a', 'an', 'to')]
        keyword_q = " ".join(words[:6])
        recent_q = f"{keyword_q} {current_year}" if str(current_year) not in keyword_q else keyword_q
        return [recent_q, keyword_q], clean_q[:40].title()

    def formulate_verification_queries(
        self,
        query: str,
        doc_context: str,
        extracted_links: Optional[List[str]] = None
    ) -> Tuple[List[str], str]:
        """
        When a user asks to verify, investigate claims, or search for a person/project/company
        from an attached document, formulates 1-3 targeted, entity-grounded search queries
        using proper nouns, usernames, project titles, and URLs from the document.
        Returns (list_of_queries, search_topic).
        """
        extracted_links = extracted_links or []
        links_preview = ", ".join(extracted_links[:8]) if extracted_links else "None"
        doc_snippet = doc_context[:2500].strip()

        api_keys = api_key_rotator.get_rotated_google_keys()
        if api_keys and doc_snippet:
            prompt = (
                "You are an investigative verification search planner. "
                "The user is asking to verify, fact-check, or search the internet regarding claims, people, projects, or entities in their document.\n\n"
                f"=== USER QUERY ===\n{query}\n\n"
                f"=== EXTRACTED DOCUMENT LINKS ===\n{links_preview}\n\n"
                f"=== DOCUMENT TEXT EXCERPT ===\n{doc_snippet}\n\n"
                "INSTRUCTIONS:\n"
                "Formulate 1 to 3 targeted DuckDuckGo search queries to investigate the primary subject (person's real name, company, university, project names, GitHub/LinkedIn profile).\n"
                "- NEVER output generic search phrases like 'what can u verify about his resume on internet' or 'how to check background'.\n"
                "- Extract real entity names from the document (e.g., '\"Company Name\" \"Product\"', 'username github', '\"Project Name\" Author').\n"
                "- Output ONLY a JSON object with this exact structure:\n"
                "{\n"
                '  "queries": ["query 1", "query 2"],\n'
                '  "topic": "Concise 3-5 word topic for UI badge (e.g. Entity & Claim Verification)"\n'
                "}\n"
            )

            for key in api_keys[:2]:
                try:
                    llm = self._get_llm(key, streaming=False, temperature=0.1)
                    res = llm.invoke([HumanMessage(content=prompt)])
                    raw = res.content if isinstance(res.content, str) else str(res.content)
                    match = re.search(r'\{.*\}', raw, re.DOTALL)
                    if match:
                        data = json.loads(match.group(0))
                        queries = [str(q).strip() for q in data.get("queries", []) if str(q).strip()]
                        topic = str(data.get("topic", "")).strip() or "Verification Search"
                        if queries:
                            return queries[:3], topic
                except Exception as e:
                    logger.warning(f"Verification query generation attempt failed: {e}")
                    continue

        return self._heuristic_verification_fallback(query, doc_snippet, extracted_links)

    def _heuristic_verification_fallback(
        self,
        query: str,
        doc_snippet: str,
        extracted_links: List[str]
    ) -> Tuple[List[str], str]:
        queries: List[str] = []
        topic = "Document Entity Verification"

        # 1. Try to extract GitHub username or handle from links
        for link in extracted_links:
            if "github.com/" in link:
                handle = link.split("github.com/")[-1].strip("/").split("/")[0]
                if handle and handle.lower() not in ["topics", "explore", "features", "pricing"]:
                    queries.append(f"{handle} github")
            elif "linkedin.com/in/" in link:
                slug = link.split("linkedin.com/in/")[-1].strip("/").split("/")[0]
                if slug:
                    queries.append(f"{slug} linkedin")

        # 2. Extract prominent entity name from first lines of document
        lines = [line.strip() for line in doc_snippet.splitlines() if line.strip() and not line.startswith("---") and not line.startswith("[")]
        subject_name = ""
        for line in lines[:6]:
            words = line.split()
            if 2 <= len(words) <= 5 and all(w[0].isupper() for w in words if w.isalpha()):
                subject_name = " ".join(words)
                break

        if subject_name:
            queries.insert(0, f'"{subject_name}"')
            topic = f"{subject_name} Verification"

        if not queries:
            clean_q = re.sub(
                r'\b(verify|verification|check|on internet|what can u|can you|search|his|her|this|the|resume|claims|background)\b',
                '',
                query,
                flags=re.IGNORECASE
            ).strip()
            queries = [clean_q if len(clean_q) > 3 else query[:60]]
            topic = "Online Verification"

        return queries[:3], topic


    def generate_followup_questions(self, query: str, answer_snippet: str) -> List[str]:
        """
        Generates 3-4 natural follow-up questions tailored to the user query and response (Perplexity-style).
        """
        default_fallbacks = [
            "Elaborate on this",
            f"What are key pros and cons regarding {query[:25]}?",
            "Can you provide more specific examples?",
            "What should I be mindful of next?"
        ]

        api_keys = api_key_rotator.get_rotated_google_keys()
        if not api_keys:
            return default_fallbacks

        prompt = (
            "Based on the following query and answer, generate 3 or 4 concise, natural follow-up questions "
            "that a user would click next (like Perplexity or ChatGPT). "
            "The first item should often be a simple follow-up like 'Elaborate' if applicable.\n"
            "Return ONLY a valid JSON list of strings, for example: "
            '["Elaborate", "What is the minimum follower count for monetization?", "How does the revenue split compare?"]\n\n'
            f"Query: {query[:300]}\n\n"
            f"Answer summary: {answer_snippet[:600]}"
        )

        for key in api_keys[:2]:
            try:
                llm = self._get_llm(key, streaming=False, temperature=0.3)
                res = llm.invoke([HumanMessage(content=prompt)])
                raw = res.content.strip()
                # Parse JSON array
                match = re.search(r'\[.*\]', raw, re.DOTALL)
                if match:
                    parsed = json.loads(match.group(0))
                    if isinstance(parsed, list) and len(parsed) >= 2:
                        return [str(q).strip() for q in parsed[:4] if str(q).strip()]
            except Exception as e:
                logger.warning(f"Followup question generation error: {e}")
                continue

        return default_fallbacks

    def generate_title(self, prompt: str) -> str:
        """
        Generates a concise 3-5 word conversation title from user's first message.
        """
        api_keys = api_key_rotator.get_rotated_google_keys()
        if not api_keys:
            return prompt[:30] + ("..." if len(prompt) > 30 else "")

        title_prompt = (
            "Summarize the following user request into a concise, punchy 3 to 6 word title. "
            "Do NOT use quotes, punctuation, or 'Title:'. Just the words.\n\n"
            f"User request: {prompt[:300]}"
        )
        for key in api_keys:
            try:
                llm = self._get_llm(key, streaming=False, temperature=0.2)
                res = llm.invoke([HumanMessage(content=title_prompt)])
                title = res.content.strip().strip('"').strip("'")
                if title:
                    return title[:60]
            except Exception:
                continue
        return prompt[:30] + ("..." if len(prompt) > 30 else "")

llm_service = LLMService()
