from fastapi import APIRouter, HTTPException
from langchain_core.messages import HumanMessage, AIMessage
from app.api.models import QueryRequest
from app.core.database import get_db_conn
from app.services.vector_service import vector_service
from app.services.llm_service import llm_service, AIQuotaExceededError, AIInvalidKeyError

router = APIRouter()

@router.get("/query/history/{document_id}")
def get_chat_history(document_id: str, user_id: str):
    conn = get_db_conn()
    cur  = conn.cursor()

    # Fetch chat history
    cur.execute(
        """
        SELECT prompt, answer FROM chat_history
        WHERE user_id = %s AND document_id = %s
        ORDER BY created_at DESC LIMIT 50
        """,
        (user_id, document_id),
    )
    rows = cur.fetchall()
    rows.reverse()
    
    cur.close(); conn.close()
    
    # Format and return history as a list of dicts for simple frontend consumption
    history = []
    for prompt_text, answer_text in rows:
        history.append({"role": "human", "content": prompt_text})
        history.append({"role": "ai", "content": answer_text})
        
    return {"history": history}

@router.post("/query")
def query_rag(req: QueryRequest):
    conn = get_db_conn()
    cur  = conn.cursor()

    # Fetch chat history
    cur.execute(
        """
        SELECT prompt, answer FROM chat_history
        WHERE user_id = %s AND document_id = %s
        ORDER BY created_at DESC LIMIT 10
        """,
        (req.user_id, req.document_id),
    )
    rows = cur.fetchall()
    rows.reverse()

    chat_history = []
    for prompt_text, answer_text in rows:
        chat_history.append(HumanMessage(content=prompt_text))
        chat_history.append(AIMessage(content=answer_text))

    # Retriever
    retriever = vector_service.get_namespace_retriever(req.user_id, req.document_id)

    try:
        response = llm_service.generate_rag_response(req.text, chat_history, retriever)
    except AIQuotaExceededError as e:
        cur.close(); conn.close()
        raise HTTPException(status_code=429, detail=str(e))
    except AIInvalidKeyError as e:
        cur.close(); conn.close()
        # Upstream authentication/config problem
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        cur.close(); conn.close()
        raise HTTPException(status_code=500, detail=str(e))

    # Extract answer and sources
    answer = (
        response.get("answer")
        or response.get("result")
        or response.get("output_text")
        or "No answer found."
    )

    seen, sources = set(), []
    for doc in response.get("context", []):
        fname = doc.metadata.get("filename", "")
        if fname and fname not in seen:
            seen.add(fname); sources.append(fname)

    # Save to Database
    cur.execute(
        "INSERT INTO chat_history (user_id, document_id, prompt, answer) VALUES (%s, %s, %s, %s)",
        (req.user_id, req.document_id, req.text, answer),
    )
    conn.commit()
    cur.close(); conn.close()
    
    return {"answer": answer, "sources": sources}
