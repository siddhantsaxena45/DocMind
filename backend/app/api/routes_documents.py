from fastapi import APIRouter, HTTPException, Query
from app.core.database import get_db_conn
from app.services.vector_service import vector_service

router = APIRouter()

@router.delete("/documents/{document_id}")
def delete_document(
    document_id: str,
    user_id: str = Query(...),
):
    conn = get_db_conn()
    cur  = conn.cursor()

    # Verify ownership
    cur.execute(
        "SELECT id FROM documents WHERE id = %s AND user_id = %s",
        (document_id, user_id),
    )
    if not cur.fetchone():
        cur.close(); conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete Pinecone vectors
    try:
        vector_service.pc.Index(vector_service.index_name).delete(
            filter={"document_id": document_id}, namespace=user_id
        )
    except Exception as e:
        print(f"Pinecone delete warning (non-fatal): {e}")

    # Delete chat history rows
    cur.execute(
        "DELETE FROM chat_history WHERE document_id = %s AND user_id = %s",
        (document_id, user_id),
    )

    # Delete document row
    cur.execute(
        "DELETE FROM documents WHERE id = %s AND user_id = %s",
        (document_id, user_id),
    )

    conn.commit()
    cur.close(); conn.close()
    return {"message": "Document deleted successfully", "document_id": document_id}

@router.get("/history/{user_id}/{document_id}")
def get_history(user_id: str, document_id: str):
    conn = get_db_conn()
    cur  = conn.cursor()
    cur.execute(
        "SELECT prompt, answer FROM chat_history WHERE user_id = %s AND document_id = %s ORDER BY created_at ASC",
        (user_id, document_id),
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    history = []
    for p, a in rows:
        history.append({"role": "human", "content": p})
        history.append({"role": "ai",    "content": a})
    return {"history": history}

@router.get("/documents/{user_id}")
def get_documents(user_id: str):
    conn = get_db_conn()
    cur  = conn.cursor()
    cur.execute(
        "SELECT id, filename FROM documents WHERE user_id = %s ORDER BY id DESC",
        (user_id,),
    )
    docs = cur.fetchall()
    cur.close(); conn.close()
    return {"documents": [{"id": str(d[0]), "filename": d[1]} for d in docs]}
