import logging
import json
import re
from typing import List, AsyncGenerator, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from app.core.config import settings, api_key_rotator

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are DocMind AI, a state-of-the-art Research and Document Intelligence Assistant.

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
"""

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
        messages: List[BaseMessage] = [SystemMessage(content=SYSTEM_PROMPT)]

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
