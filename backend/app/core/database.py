import psycopg2
from app.core.config import settings

def get_db_conn():
    return psycopg2.connect(settings.DATABASE_URL)


def ensure_schema():
    """
    Lightweight schema bootstrap (no migration tool in repo).
    Safe to call multiple times.
    """
    conn = get_db_conn()
    cur = conn.cursor()

    # Users table: add auth columns if missing
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          username varchar UNIQUE NOT NULL,
          password_hash text,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        """
    )
    # If table pre-existed without these columns, add them
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();")

    # Documents + chat_history may already exist; leave as-is if created elsewhere.
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS documents (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          filename text NOT NULL,
          storage_path text,
          created_at timestamptz NOT NULL DEFAULT now(),
          full_text text
        );
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS chat_history (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          document_id varchar NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          prompt text NOT NULL,
          answer text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        """
    )

    # Cache AI feature outputs per document (solves "tab switch state vanishes")
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS document_feature_cache (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          document_id varchar NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          feature varchar NOT NULL,
          payload jsonb NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE(user_id, document_id, feature)
        );
        """
    )

    conn.commit()
    cur.close()
    conn.close()
