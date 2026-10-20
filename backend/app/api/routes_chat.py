import json
import asyncio
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import StreamingResponse
from app.api.models import (
    ConversationCreate, ConversationUpdate, ConversationItem,
    ConversationDetailResponse, MessageItem, SendMessageRequest,
    SendMessageResponse, Citation
)
from app.core.database import get_db_conn
from app.core.auth import get_current_user, AuthUser
from app.services.rag_service import rag_service
from app.services.llm_service import llm_service
import jwt
from app.core.config import settings

router = APIRouter(prefix="/api/conversations", tags=["Conversations / Chat"])


def _verify_conversation_owner(cur, conversation_id: str, user_id: str):
    cur.execute(
        "SELECT id, title, selected_doc_ids, web_search_enabled FROM conversations WHERE id = %s AND user_id = %s",
        (conversation_id, user_id)
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation not found or unauthorized")
    return {
        "id": str(row[0]),
        "title": row[1],
        "selected_doc_ids": row[2] if isinstance(row[2], list) else (json.loads(row[2]) if row[2] else []),
        "web_search_enabled": bool(row[3])
    }


@router.get("", response_model=List[ConversationItem])
def list_conversations(current_user: AuthUser = Depends(get_current_user)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT c.id, c.title, c.selected_doc_ids, c.web_search_enabled, c.created_at, c.updated_at,
               (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_msg
        FROM conversations c
        WHERE c.user_id = %s
        ORDER BY c.updated_at DESC
        """,
        (current_user.user_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    conversations = []
    for r in rows:
        docs = r[2] if isinstance(r[2], list) else (json.loads(r[2]) if r[2] else [])
        conversations.append(ConversationItem(
            id=str(r[0]),
            title=r[1],
            selected_doc_ids=docs,
            web_search_enabled=bool(r[3]),
            created_at=r[4].isoformat() if r[4] else "",
            updated_at=r[5].isoformat() if r[5] else "",
            last_message=r[6]
        ))
    return conversations


@router.post("", response_model=ConversationItem)
def create_conversation(
    req: ConversationCreate,
    current_user: AuthUser = Depends(get_current_user)
):
    conn = get_db_conn()
    cur = conn.cursor()
    title = (req.title or "New Chat").strip()
    selected_docs_json = json.dumps(req.selected_doc_ids or [])
    web_search = True if req.web_search_enabled is None else req.web_search_enabled

    cur.execute(
        """
        INSERT INTO conversations (user_id, title, selected_doc_ids, web_search_enabled)
        VALUES (%s, %s, %s::jsonb, %s)
        RETURNING id, created_at, updated_at
        """,
        (current_user.user_id, title, selected_docs_json, web_search)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return ConversationItem(
        id=str(row[0]),
        title=title,
        selected_doc_ids=req.selected_doc_ids or [],
        web_search_enabled=web_search,
        created_at=row[1].isoformat(),
        updated_at=row[2].isoformat(),
        last_message=None
    )


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation_details(
    conversation_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    conn = get_db_conn()
    cur = conn.cursor()
    conv = _verify_conversation_owner(cur, conversation_id, current_user.user_id)

    cur.execute(
        """
        SELECT id, role, content, sources, related_questions, research_query, created_at
        FROM messages
        WHERE conversation_id = %s
        ORDER BY created_at ASC
        """,
        (conversation_id,)
    )
    msg_rows = cur.fetchall()
    cur.close()
    conn.close()

    messages = []
    for m in msg_rows:
        srcs = m[3] if isinstance(m[3], list) else (json.loads(m[3]) if m[3] else [])
        citations = [Citation(**s) for s in srcs if isinstance(s, dict)]
        rel_q = m[4] if isinstance(m[4], list) else (json.loads(m[4]) if m[4] else [])
        r_query = m[5]
        messages.append(MessageItem(
            id=str(m[0]),
            role=m[1],
            content=m[2],
            sources=citations,
            related_questions=rel_q,
            research_query=r_query,
            created_at=m[6].isoformat() if m[6] else ""
        ))

    conv_item = ConversationItem(
        id=conv["id"],
        title=conv["title"],
        selected_doc_ids=conv["selected_doc_ids"],
        web_search_enabled=conv["web_search_enabled"],
        created_at="",
        updated_at=""
    )
    return ConversationDetailResponse(conversation=conv_item, messages=messages)


@router.patch("/{conversation_id}", response_model=ConversationItem)
def update_conversation(
    conversation_id: str,
    req: ConversationUpdate,
    current_user: AuthUser = Depends(get_current_user)
):
    conn = get_db_conn()
    cur = conn.cursor()
    conv = _verify_conversation_owner(cur, conversation_id, current_user.user_id)

    updates = []
    params = []

    if req.title is not None:
        updates.append("title = %s")
        params.append(req.title.strip())

    if req.selected_doc_ids is not None:
        updates.append("selected_doc_ids = %s::jsonb")
        params.append(json.dumps(req.selected_doc_ids))

    if req.web_search_enabled is not None:
        updates.append("web_search_enabled = %s")
        params.append(req.web_search_enabled)

    if updates:
        updates.append("updated_at = now()")
        params.extend([conversation_id, current_user.user_id])
        cur.execute(
            f"UPDATE conversations SET {', '.join(updates)} WHERE id = %s AND user_id = %s RETURNING title, selected_doc_ids, web_search_enabled, created_at, updated_at",
            tuple(params)
        )
        row = cur.fetchone()
        conn.commit()
        title = row[0]
        selected_docs = row[1] if isinstance(row[1], list) else (json.loads(row[1]) if row[1] else [])
        web_search = bool(row[2])
        created_at = row[3].isoformat()
        updated_at = row[4].isoformat()
    else:
        title = conv["title"]
        selected_docs = conv["selected_doc_ids"]
        web_search = conv["web_search_enabled"]
        created_at = ""
        updated_at = ""

    cur.close()
    conn.close()

    return ConversationItem(
        id=conversation_id,
        title=title,
        selected_doc_ids=selected_docs,
        web_search_enabled=web_search,
        created_at=created_at,
        updated_at=updated_at
    )


@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    conn = get_db_conn()
    cur = conn.cursor()
    _verify_conversation_owner(cur, conversation_id, current_user.user_id)

    cur.execute("DELETE FROM conversations WHERE id = %s AND user_id = %s", (conversation_id, current_user.user_id))
    conn.commit()
    cur.close()
    conn.close()

    return {"message": "Conversation deleted successfully", "conversation_id": conversation_id}


@router.post("/{conversation_id}/messages", response_model=SendMessageResponse)
def send_message(
    conversation_id: str,
    req: SendMessageRequest,
    current_user: AuthUser = Depends(get_current_user)
):
    conn = get_db_conn()
    cur = conn.cursor()
    conv = _verify_conversation_owner(cur, conversation_id, current_user.user_id)

    user_text = req.text.strip()
    if not user_text:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Message text cannot be empty")

    # 1. Insert user message
    cur.execute(
        """
        INSERT INTO messages (conversation_id, user_id, role, content)
        VALUES (%s, %s, %s, %s)
        """,
        (conversation_id, current_user.user_id, "user", user_text)
    )

    # 2. Check auto-naming if title is 'New Chat'
    if conv["title"] == "New Chat":
        auto_title = llm_service.generate_title(user_text)
        cur.execute(
            "UPDATE conversations SET title = %s WHERE id = %s",
            (auto_title, conversation_id)
        )

    # 3. Fetch past messages for context
    cur.execute(
        """
        SELECT role, content FROM messages
        WHERE conversation_id = %s
        ORDER BY created_at ASC
        LIMIT 10
        """,
        (conversation_id,)
    )
    history_rows = cur.fetchall()
    chat_history = [{"role": r[0], "content": r[1]} for r in history_rows]

    # 4. RAG Retrieval
    doc_ids = req.selected_doc_ids if req.selected_doc_ids is not None else conv.get("selected_doc_ids", [])
    web_enabled = req.web_search if req.web_search is not None else conv["web_search_enabled"]

    context, citations = rag_service.assemble_rag_context(
        query=user_text,
        user_id=current_user.user_id,
        document_ids=doc_ids,
        enable_web_search=web_enabled
    )

    # 5. Extract research query if web search or docs used
    research_query = llm_service.extract_research_query(user_text) if web_enabled else None

    # 6. LLM Synthesis
    try:
        answer = llm_service.generate_rag_response(
            query=user_text,
            chat_history=chat_history,
            context=context
        )
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {e}")

    # 7. Generate follow-up / related questions (Perplexity style)
    related_questions = llm_service.generate_followup_questions(user_text, answer)

    # 8. Save assistant message with citations, related questions, and research query
    citations_data = [c.model_dump() for c in citations]
    cur.execute(
        """
        INSERT INTO messages (conversation_id, user_id, role, content, sources, related_questions, research_query)
        VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb, %s)
        RETURNING id
        """,
        (
            conversation_id,
            current_user.user_id,
            "assistant",
            answer,
            json.dumps(citations_data),
            json.dumps(related_questions),
            research_query
        )
    )
    assistant_msg_id = str(cur.fetchone()[0])

    cur.execute("UPDATE conversations SET updated_at = now() WHERE id = %s", (conversation_id,))
    conn.commit()
    cur.close()
    conn.close()

    return SendMessageResponse(
        message_id=assistant_msg_id,
        answer=answer,
        sources=citations,
        related_questions=related_questions,
        research_query=research_query,
        conversation_id=conversation_id
    )


@router.get("/{conversation_id}/messages/stream")
async def stream_message(
    conversation_id: str,
    text: str = Query(...),
    token: str = Query(...),
    web_search: Optional[bool] = Query(None),
    selected_docs: Optional[str] = Query(None)  # comma-separated doc IDs
):
    # Verify token
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = str(payload.get("sub"))
        username = str(payload.get("username"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token for streaming")

    conn = get_db_conn()
    cur = conn.cursor()
    conv = _verify_conversation_owner(cur, conversation_id, user_id)

    user_text = text.strip()
    if not user_text:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Insert user message
    cur.execute(
        "INSERT INTO messages (conversation_id, user_id, role, content) VALUES (%s, %s, %s, %s)",
        (conversation_id, user_id, "user", user_text)
    )

    new_title = None
    if conv["title"] == "New Chat":
        new_title = llm_service.generate_title(user_text)
        cur.execute("UPDATE conversations SET title = %s WHERE id = %s", (new_title, conversation_id))

    # Fetch history
    cur.execute(
        "SELECT role, content FROM messages WHERE conversation_id = %s ORDER BY created_at ASC LIMIT 10",
        (conversation_id,)
    )
    history_rows = cur.fetchall()
    chat_history = [{"role": r[0], "content": r[1]} for r in history_rows]

    conn.commit()
    cur.close()
    conn.close()

    # RAG Retrieval
    doc_ids = [d.strip() for d in selected_docs.split(",") if d.strip()] if selected_docs is not None else conv.get("selected_doc_ids", [])
    web_enabled = web_search if web_search is not None else conv["web_search_enabled"]

    context, citations = rag_service.assemble_rag_context(
        query=user_text,
        user_id=user_id,
        document_ids=doc_ids,
        enable_web_search=web_enabled
    )

    # Extract research query for UI status badge
    research_query = llm_service.extract_research_query(user_text) if web_enabled else None

    async def event_generator():
        # 1. Send title if updated
        if new_title:
            yield f"event: title\ndata: {json.dumps({'title': new_title})}\n\n"

        # 2. Send research status (Perplexity style status bar)
        research_status = f"Researched {research_query}" if research_query else "Consulted knowledge base"
        yield f"event: research\ndata: {json.dumps({'query': research_query or user_text[:40], 'status': research_status, 'sources_count': len(citations)})}\n\n"

        # 3. Send rich citations
        citations_data = [c.model_dump() for c in citations]
        yield f"event: citations\ndata: {json.dumps(citations_data)}\n\n"

        # 4. Stream LLM tokens
        full_answer = []
        async for chunk in llm_service.stream_rag_response(user_text, chat_history, context):
            full_answer.append(chunk)
            yield f"event: chunk\ndata: {json.dumps({'chunk': chunk})}\n\n"

        complete_text = "".join(full_answer)

        # 5. Generate follow-up / related questions
        related_questions = llm_service.generate_followup_questions(user_text, complete_text)
        yield f"event: related\ndata: {json.dumps(related_questions)}\n\n"

        # 6. Save assistant message to DB
        save_conn = get_db_conn()
        save_cur = save_conn.cursor()
        save_cur.execute(
            """
            INSERT INTO messages (conversation_id, user_id, role, content, sources, related_questions, research_query)
            VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb, %s)
            RETURNING id
            """,
            (
                conversation_id,
                user_id,
                "assistant",
                complete_text,
                json.dumps(citations_data),
                json.dumps(related_questions),
                research_query
            )
        )
        msg_id = str(save_cur.fetchone()[0])
        save_cur.execute("UPDATE conversations SET updated_at = now() WHERE id = %s", (conversation_id,))
        save_conn.commit()
        save_cur.close()
        save_conn.close()

        yield f"event: done\ndata: {json.dumps({'message_id': msg_id, 'related_questions': related_questions, 'research_query': research_query})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/{conversation_id}/regenerate", response_model=SendMessageResponse)
def regenerate_response(
    conversation_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    conn = get_db_conn()
    cur = conn.cursor()
    conv = _verify_conversation_owner(cur, conversation_id, current_user.user_id)

    # Find the last user message
    cur.execute(
        """
        SELECT id, content FROM messages
        WHERE conversation_id = %s AND role = 'user'
        ORDER BY created_at DESC LIMIT 1
        """,
        (conversation_id,)
    )
    last_user_msg = cur.fetchone()
    if not last_user_msg:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="No user message found to regenerate")

    user_text = last_user_msg[1]

    # Delete the subsequent assistant message if present
    cur.execute(
        """
        DELETE FROM messages
        WHERE id IN (
            SELECT id FROM messages
            WHERE conversation_id = %s AND role = 'assistant'
            ORDER BY created_at DESC LIMIT 1
        )
        """,
        (conversation_id,)
    )

    # Fetch history
    cur.execute(
        """
        SELECT role, content FROM messages
        WHERE conversation_id = %s
        ORDER BY created_at ASC
        LIMIT 10
        """,
        (conversation_id,)
    )
    history_rows = cur.fetchall()
    chat_history = [{"role": r[0], "content": r[1]} for r in history_rows]

    # RAG Retrieval
    context, citations = rag_service.assemble_rag_context(
        query=user_text,
        user_id=current_user.user_id,
        document_ids=conv.get("selected_doc_ids", []),
        enable_web_search=conv["web_search_enabled"]
    )

    research_query = llm_service.extract_research_query(user_text) if conv["web_search_enabled"] else None

    # Generate fresh response
    answer = llm_service.generate_rag_response(
        query=user_text,
        chat_history=chat_history,
        context=context
    )

    related_questions = llm_service.generate_followup_questions(user_text, answer)

    citations_data = [c.model_dump() for c in citations]
    cur.execute(
        """
        INSERT INTO messages (conversation_id, user_id, role, content, sources, related_questions, research_query)
        VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb, %s)
        RETURNING id
        """,
        (
            conversation_id,
            current_user.user_id,
            "assistant",
            answer,
            json.dumps(citations_data),
            json.dumps(related_questions),
            research_query
        )
    )
    assistant_msg_id = str(cur.fetchone()[0])
    cur.execute("UPDATE conversations SET updated_at = now() WHERE id = %s", (conversation_id,))
    conn.commit()
    cur.close()
    conn.close()

    return SendMessageResponse(
        message_id=assistant_msg_id,
        answer=answer,
        sources=citations,
        related_questions=related_questions,
        research_query=research_query,
        conversation_id=conversation_id
    )
