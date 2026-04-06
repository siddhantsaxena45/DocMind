from fastapi import APIRouter, HTTPException
from app.api.models import UserRequest, SignupRequest, LoginRequest
from app.core.database import get_db_conn
from app.core.auth import create_access_token, hash_password, verify_password, get_current_user, AuthUser

router = APIRouter()

# Legacy dev endpoint (kept for backward compatibility with current frontend)
@router.post("/get_or_create_user")
def get_or_create_user(req: UserRequest):
    conn = get_db_conn()
    cur  = conn.cursor()
    cur.execute("SELECT id FROM users WHERE username = %s", (req.username,))
    row = cur.fetchone()
    if row:
        user_id = str(row[0])
    else:
        cur.execute(
            "INSERT INTO users (username) VALUES (%s) RETURNING id",
            (req.username,),
        )
        conn.commit()
        user_id = str(cur.fetchone()[0])
    cur.close()
    conn.close()
    return {"user_id": user_id, "username": req.username}


@router.post("/auth/signup")
def signup(req: SignupRequest):
    username = req.username.strip()
    if not username or not req.password:
        raise HTTPException(status_code=400, detail="Username and password required")

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    if cur.fetchone():
        cur.close(); conn.close()
        raise HTTPException(status_code=409, detail="Username already exists")

    pw_hash = hash_password(req.password)
    cur.execute(
        "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
        (username, pw_hash),
    )
    conn.commit()
    user_id = str(cur.fetchone()[0])
    cur.close(); conn.close()

    token = create_access_token(user_id=user_id, username=username)
    return {"access_token": token, "token_type": "bearer", "user_id": user_id, "username": username}


@router.post("/auth/login")
def login(req: LoginRequest):
    username = req.username.strip()
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, password_hash FROM users WHERE username = %s", (username,))
    row = cur.fetchone()
    cur.close(); conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_id, pw_hash = str(row[0]), row[1]
    if not pw_hash or not verify_password(req.password, pw_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user_id=user_id, username=username)
    return {"access_token": token, "token_type": "bearer", "user_id": user_id, "username": username}


@router.get("/auth/me")
def me(user: AuthUser = get_current_user):
    return {"user_id": user.user_id, "username": user.username}
