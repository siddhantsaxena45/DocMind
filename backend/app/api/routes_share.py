import secrets
import json
from fastapi import APIRouter, HTTPException, Depends, Request
from app.api.models import ShareResponse, SharedConversationView, MessageItem, Citation
from app.core.database import get_db_conn
from app.core.auth import get_current_user, AuthUser

router = APIRouter(prefix="/api/share", tags=["Chat Sharing"])

@router.post("/{conversation_id}", response_model=ShareResponse)
def create_share_link(
    conversation_id: str,
    request: Request,
    current_user: AuthUser = Depends(get_current_user)
):
    conn = get_db_conn()
    cur = conn.cursor()

    # 1. Verify ownership & get conversation
    cur.execute(
        "SELECT id, title FROM conversations WHERE id = %s AND user_id = %s",
        (conversation_id, current_user.user_id)
    )
    conv = cur.fetchone()
    if not conv:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found or unauthorized")

    title = conv[1]

    # 2. Get current messages snapshot
    cur.execute(
        """
        SELECT id, role, content, sources, related_questions, research_query, created_at
        FROM messages
        WHERE conversation_id = %s
        ORDER BY created_at ASC
        """,
        (conversation_id,)
    )
    rows = cur.fetchall()

    messages_snapshot = []
    for r in rows:
        srcs = r[3] if isinstance(r[3], list) else (json.loads(r[3]) if r[3] else [])
        rel_q = r[4] if isinstance(r[4], list) else (json.loads(r[4]) if r[4] else [])
        messages_snapshot.append({
            "id": str(r[0]),
            "role": r[1],
            "content": r[2],
            "sources": srcs,
            "related_questions": rel_q,
            "research_query": r[5],
            "created_at": r[6].isoformat() if r[6] else ""
        })

    # 3. Check if active share already exists
    cur.execute(
        """
        SELECT share_token, created_at
        FROM shared_conversations
        WHERE conversation_id = %s AND user_id = %s AND is_active = true
        ORDER BY created_at DESC LIMIT 1
        """,
        (conversation_id, current_user.user_id)
    )
    existing_share = cur.fetchone()

    if existing_share:
        share_token = existing_share[0]
        created_at = existing_share[1].isoformat()
        # Update snapshot to include newest messages
        cur.execute(
            """
            UPDATE shared_conversations
            SET messages_snapshot = %s::jsonb, title = %s
            WHERE share_token = %s
            """,
            (json.dumps(messages_snapshot), title, share_token)
        )
        conn.commit()
    else:
        share_token = secrets.token_urlsafe(18)
        cur.execute(
            """
            INSERT INTO shared_conversations (share_token, conversation_id, user_id, title, messages_snapshot, is_active)
            VALUES (%s, %s, %s, %s, %s::jsonb, true)
            RETURNING created_at
            """,
            (share_token, conversation_id, current_user.user_id, title, json.dumps(messages_snapshot))
        )
        created_at = cur.fetchone()[0].isoformat()
        conn.commit()

    cur.close()
    conn.close()

    return ShareResponse(
        share_url=f"/share/{share_token}",
        share_token=share_token,
        created_at=created_at
    )


@router.get("/{share_token}", response_model=SharedConversationView)
def get_shared_conversation(share_token: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT title, messages_snapshot, created_at, is_active
        FROM shared_conversations
        WHERE share_token = %s
        """,
        (share_token,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row or not row[3]:
        raise HTTPException(
            status_code=404,
            detail="This shared conversation link does not exist or has been revoked by the owner."
        )

    title = row[0]
    raw_msgs = row[1] if isinstance(row[1], list) else (json.loads(row[1]) if row[1] else [])
    created_at = row[2].isoformat() if row[2] else ""

    messages = []
    for m in raw_msgs:
        srcs = [Citation(**s) for s in m.get("sources", []) if isinstance(s, dict)]
        messages.append(MessageItem(
            id=m.get("id", ""),
            role=m.get("role", "assistant"),
            content=m.get("content", ""),
            sources=srcs,
            related_questions=m.get("related_questions", []),
            research_query=m.get("research_query"),
            created_at=m.get("created_at", "")
        ))

    return SharedConversationView(
        share_token=share_token,
        title=title,
        created_at=created_at,
        messages=messages
    )


@router.delete("/{share_token}")
def revoke_share_link(
    share_token: str,
    current_user: AuthUser = Depends(get_current_user)
):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE shared_conversations
        SET is_active = false, revoked_at = now()
        WHERE share_token = %s AND user_id = %s
        RETURNING id
        """,
        (share_token, current_user.user_id)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Shared link not found or unauthorized")

    return {"message": "Shared conversation revoked successfully", "share_token": share_token}
