import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from app.core.config import settings

def get_db_conn():
    if not settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured in environment.")
    return psycopg2.connect(settings.DATABASE_URL, connect_timeout=10)

@contextmanager
def get_db():
    conn = get_db_conn()
    try:
        yield conn
    finally:
        conn.close()

def ensure_schema():
    """
    Creates and migrates the production database schema for DocMind Advanced RAG Chatbot.
    Safe to execute multiple times.
    """
    conn = get_db_conn()
    cur = conn.cursor()

    # 1. Users
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
            username varchar UNIQUE NOT NULL,
            password_hash text NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        """
    )
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();")

    # 2. Documents
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS documents (
            id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
            user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            filename text NOT NULL,
            file_type varchar(20) NOT NULL DEFAULT 'pdf',
            file_size bigint DEFAULT 0,
            status varchar(20) NOT NULL DEFAULT 'ready',
            error_message text,
            chunk_count int DEFAULT 0,
            storage_path text,
            full_text text,
            created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id, created_at DESC);
        """
    )
    cur.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type varchar(20) NOT NULL DEFAULT 'pdf';")
    cur.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size bigint DEFAULT 0;")
    cur.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'ready';")
    cur.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS error_message text;")
    cur.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS chunk_count int DEFAULT 0;")
    cur.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS full_text text;")

    # 3. Conversations
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS conversations (
            id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
            user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title text NOT NULL DEFAULT 'New Chat',
            selected_doc_ids jsonb DEFAULT '[]'::jsonb,
            web_search_enabled boolean DEFAULT true,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);
        """
    )

    # 4. Messages
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
            conversation_id varchar NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role varchar(20) NOT NULL,
            content text NOT NULL,
            sources jsonb DEFAULT '[]'::jsonb,
            created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
        """
    )

    # 5. Shared Conversations
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS shared_conversations (
            id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
            share_token varchar(64) UNIQUE NOT NULL,
            conversation_id varchar NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title text NOT NULL,
            messages_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamptz NOT NULL DEFAULT now(),
            revoked_at timestamptz
        );
        CREATE INDEX IF NOT EXISTS idx_shared_token ON shared_conversations(share_token);
        """
    )

    # Clean up obsolete document_feature_cache if present
    cur.execute("DROP TABLE IF EXISTS document_feature_cache;")

    # Enforce Row Level Security (RLS) on all public tables to eliminate Supabase public Data API exposure
    cur.execute(
        """
        ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS conversations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS shared_conversations ENABLE ROW LEVEL SECURITY;
        """
    )

    conn.commit()
    cur.close()
    conn.close()
