import logging
from typing import List, AsyncGenerator, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from app.core.config import settings, api_key_rotator

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are DocMind AI, a state-of-the-art GPT-like Research and Document Intelligence Assistant.

Your purpose is to answer the user's questions with exceptional precision, analytical depth, and clarity, drawing upon the provided Document Evidence and Real-Time Web Search Evidence.

CORE OPERATIONAL RULES:
1. CITATIONS & GROUNDING:
   - Always substantiate factual claims with inline references to the source material.
   - When citing documents, cite accurately: `[Doc: <filename>, Page <X>]`.
   - When citing web sources, cite with markdown links: `[<Title>](<URL>)`.
   - NEVER fabricate or extrapolate citations that are not in the provided context.
   - If the provided document and web evidence does not contain enough information to answer definitively, explicitly state: "Based on the provided documents and web search, there is insufficient evidence to confirm..." and explain what is known.

2. PRESENTATION & FORMATTING:
   - Produce beautifully formatted Markdown:
     * Use descriptive headings (##, ###) where appropriate.
     * Use bolding for key terms.
     * Format numerical comparisons, lists, or specs using Markdown tables.
     * Format code snippets inside fenced code blocks with the correct language tag (e.g., ```python).
     * Use clean bullet points for multi-part explanations.

3. CONTEXT INTEGRATION:
   - When both document context and web context are provided, synthesize them logically.
   - You may address follow-up questions by considering the conversation history.
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
