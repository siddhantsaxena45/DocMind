from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains import create_retrieval_chain
from app.core.config import settings, api_key_rotator

class AIQuotaExceededError(RuntimeError):
    pass

class AIInvalidKeyError(RuntimeError):
    pass

class LLMService:
    def generate_rag_response(self, query: str, chat_history: list, retriever):
        SYSTEM_PROMPT = """
You are an AI assistant that answers ONLY using the provided document context.

Rules:
- If the answer exists in the context, explain it clearly and in detail.
- If the answer is not in the context, respond exactly: "I don't know based on the document."
- Do NOT use outside knowledge.
- Use markdown formatting (bullet points, bold) where helpful.

Context:
{context}
"""
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
        ])

        response = None
        last_error = ""
        
        # Get current rotated keys
        api_keys = api_key_rotator.get_rotated_google_keys()

        # Try API keys until one works (handling rate limits)
        for attempt, current_key in enumerate(api_keys):
            try:
                llm = ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash",
                    temperature=0.3,
                    google_api_key=current_key
                )
                
                qa_chain = create_stuff_documents_chain(llm, prompt_template)
                rag_chain = create_retrieval_chain(retriever, qa_chain)

                response = rag_chain.invoke({"input": query, "chat_history": chat_history})
                break 
                
            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                    print(f"[Warning] Key {attempt + 1}/{len(api_keys)} exhausted. Rotating...")
                    last_error = error_msg
                    continue
                if "API key expired" in error_msg or "API_KEY_INVALID" in error_msg or "invalid api key" in error_msg.lower():
                    print(f"[Warning] Key {attempt + 1}/{len(api_keys)} invalid/expired. Rotating...")
                    last_error = error_msg
                    continue
                else:
                    raise Exception(f"RAG chain error: {error_msg}")

        if response is None:
            if not api_keys:
                raise AIInvalidKeyError("No Google API keys configured. Set GOOGLE_API_KEY1 (and optionally more).")
            if "API key expired" in last_error or "API_KEY_INVALID" in last_error or "invalid api key" in last_error.lower():
                raise AIInvalidKeyError("All configured Google API keys are invalid/expired. Please renew/update your keys.")
            raise AIQuotaExceededError("All AI API keys are currently rate-limited. Please wait and try again.")
            
        return response

llm_service = LLMService()
