from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from app.core.database import get_db_conn
from app.services.pdf_service import pdf_service
from app.services.vector_service import vector_service

router = APIRouter()

@router.post("/upload")
async def upload_document(
    user_id: str = Form(...),
    file: UploadFile = File(...),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    content = await file.read()
    text = pdf_service.extract_text_from_bytes(content)

    if not text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from PDF")

    conn = get_db_conn()
    cur  = conn.cursor()

    # Remove duplicate
    cur.execute(
        "SELECT id FROM documents WHERE user_id = %s AND filename = %s",
        (user_id, file.filename),
    )
    existing = cur.fetchone()
    if existing:
        old_id = str(existing[0])
        try:
            vector_service.pc.Index(vector_service.index_name).delete(
                filter={"document_id": old_id}, namespace=user_id
            )
        except Exception:
            pass
        cur.execute("DELETE FROM chat_history WHERE document_id = %s", (old_id,))
        cur.execute("DELETE FROM documents WHERE id = %s", (old_id,))
        conn.commit()

    cur.execute(
        "INSERT INTO documents (user_id, filename, storage_path, full_text) VALUES (%s, %s, %s, %s) RETURNING id",
        (user_id, file.filename, "uploaded_via_api", text),
    )
    document_id = str(cur.fetchone()[0])
    conn.commit()

    docs = pdf_service.chunk_text(text, user_id, file.filename, document_id)

    try:
        vector_service.vector_db.add_documents(docs, namespace=user_id, batch_size=20)
    except Exception as e:
        cur.execute("DELETE FROM documents WHERE id = %s", (document_id,))
        conn.commit()
        cur.close(); conn.close()
        raise HTTPException(status_code=500, detail=f"Pinecone indexing failed: {e}")

    cur.close(); conn.close()
    return {"message": f"{file.filename} indexed successfully", "document_id": document_id, "chunks": len(docs)}
