import os
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from app.api.models import DocumentItem, DocumentListResponse, DocumentUploadResponse
from app.core.database import get_db_conn
from app.core.auth import get_current_user, AuthUser
from app.core.config import settings
from app.services.document_service import document_service
from app.services.vector_service import vector_service

router = APIRouter(tags=["Documents"])

SUPPORTED_EXTENSIONS = {
    "pdf", "txt", "md", "csv", "json", "docx", "doc",
    "pptx", "ppt", "xlsx", "xls", "png", "jpg", "jpeg", "webp", "bmp"
}

@router.get("/api/documents", response_model=DocumentListResponse)
def list_documents(current_user: AuthUser = Depends(get_current_user)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, filename, file_type, file_size, status, chunk_count, created_at, error_message
        FROM documents
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (current_user.user_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    docs = []
    for r in rows:
        docs.append(DocumentItem(
            id=str(r[0]),
            filename=r[1],
            file_type=r[2] or "unknown",
            file_size=r[3] or 0,
            status=r[4] or "ready",
            chunk_count=r[5] or 0,
            created_at=r[6].isoformat() if r[6] else "",
            error_message=r[7]
        ))
    return DocumentListResponse(documents=docs)


@router.post("/api/documents/upload")
async def upload_documents(
    files: List[UploadFile] = File(...),
    current_user: AuthUser = Depends(get_current_user)
):
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    results = []

    for file in files:
        ext = file.filename.lower().split(".")[-1] if "." in file.filename else ""
        if ext not in SUPPORTED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: '.{ext}'. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            )

        content = await file.read()
        file_size = len(content)

        if file_size > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File {file.filename} exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        conn = get_db_conn()
        cur = conn.cursor()

        # Check existing with same filename
        cur.execute(
            "SELECT id FROM documents WHERE user_id = %s AND filename = %s",
            (current_user.user_id, file.filename)
        )
        existing = cur.fetchone()
        if existing:
            old_id = str(existing[0])
            vector_service.delete_document_vectors(old_id, namespace=current_user.user_id)
            cur.execute("DELETE FROM documents WHERE id = %s", (old_id,))
            conn.commit()

        # Parse document
        try:
            parse_result = document_service.parse_document(content, file.filename)
            full_text = parse_result.full_text
        except Exception as e:
            cur.close()
            conn.close()
            raise HTTPException(status_code=422, detail=f"Failed to parse {file.filename}: {e}")

        # Insert document record
        cur.execute(
            """
            INSERT INTO documents (user_id, filename, file_type, file_size, status, full_text)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (current_user.user_id, file.filename, ext, file_size, "processing", full_text)
        )
        doc_id = str(cur.fetchone()[0])
        conn.commit()

        # Chunk document
        chunks = document_service.chunk_document(
            parse_result,
            user_id=current_user.user_id,
            filename=file.filename,
            document_id=doc_id
        )

        # Index vectors into user namespace
        try:
            if chunks:
                vector_service.add_documents(chunks, namespace=current_user.user_id)
            cur.execute(
                "UPDATE documents SET status = 'ready', chunk_count = %s WHERE id = %s",
                (len(chunks), doc_id)
            )
            conn.commit()
        except Exception as e:
            cur.execute(
                "UPDATE documents SET status = 'failed', error_message = %s WHERE id = %s",
                (str(e), doc_id)
            )
            conn.commit()
            cur.close()
            conn.close()
            raise HTTPException(status_code=500, detail=f"Pinecone indexing error: {e}")

        cur.close()
        conn.close()

        results.append({
            "document_id": doc_id,
            "filename": file.filename,
            "chunks": len(chunks),
            "status": "ready"
        })

    return {
        "message": f"Successfully uploaded and indexed {len(results)} document(s)",
        "documents": results
    }


@router.delete("/api/documents/{document_id}")
def delete_document(
    document_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    conn = get_db_conn()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, filename FROM documents WHERE id = %s AND user_id = %s",
        (document_id, current_user.user_id)
    )
    doc = cur.fetchone()
    if not doc:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")

    filename = doc[1]

    # Delete Pinecone vectors
    vector_service.delete_document_vectors(document_id, namespace=current_user.user_id)

    # Delete document record (cascades)
    cur.execute("DELETE FROM documents WHERE id = %s AND user_id = %s", (document_id, current_user.user_id))
    conn.commit()
    cur.close()
    conn.close()

    return {"message": f"Document '{filename}' deleted successfully", "document_id": document_id}


# Backward-compatible aliases
@router.get("/documents/{user_id}", include_in_schema=False)
def get_documents_legacy(user_id: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, filename, file_type, file_size, status, chunk_count FROM documents WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {
        "documents": [
            {
                "id": str(r[0]),
                "filename": r[1],
                "file_type": r[2] or "pdf",
                "file_size": r[3] or 0,
                "status": r[4] or "ready",
                "chunk_count": r[5] or 0
            }
            for r in rows
        ]
    }
