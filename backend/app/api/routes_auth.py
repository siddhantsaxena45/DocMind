from fastapi import APIRouter, HTTPException, Depends
from app.api.models import SignupRequest, LoginRequest, AuthResponse, UserMeResponse
from app.core.database import get_db_conn
from app.core.auth import create_access_token, hash_password, verify_password, get_current_user, AuthUser

router = APIRouter(tags=["Authentication"])

def _signup_impl(req: SignupRequest):
    username = req.username.strip().lower()
    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE LOWER(username) = %s", (username,))
    if cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=409, detail="Username is already taken")

    pw_hash = hash_password(req.password)
    cur.execute(
        "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
        (username, pw_hash),
    )
    user_id = str(cur.fetchone()[0])
    conn.commit()
    cur.close()
    conn.close()

    token = create_access_token(user_id=user_id, username=username)
    return AuthResponse(access_token=token, token_type="bearer", user_id=user_id, username=username)


def _login_impl(req: LoginRequest):
    username = req.username.strip().lower()
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, password_hash, username FROM users WHERE LOWER(username) = %s", (username,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user_id, pw_hash, stored_username = str(row[0]), row[1], row[2]
    if not verify_password(req.password, pw_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(user_id=user_id, username=stored_username)
    return AuthResponse(access_token=token, token_type="bearer", user_id=user_id, username=stored_username)


# Standard API routes
@router.post("/api/auth/signup", response_model=AuthResponse)
def signup(req: SignupRequest):
    return _signup_impl(req)

@router.post("/api/auth/login", response_model=AuthResponse)
def login(req: LoginRequest):
    return _login_impl(req)

@router.get("/api/auth/me", response_model=UserMeResponse)
def get_me(current_user: AuthUser = Depends(get_current_user)):
    return UserMeResponse(user_id=current_user.user_id, username=current_user.username)

# Backward-compatible aliases without /api prefix
@router.post("/auth/signup", response_model=AuthResponse, include_in_schema=False)
def signup_alias(req: SignupRequest):
    return _signup_impl(req)

@router.post("/auth/login", response_model=AuthResponse, include_in_schema=False)
def login_alias(req: LoginRequest):
    return _login_impl(req)

@router.get("/auth/me", response_model=UserMeResponse, include_in_schema=False)
def get_me_alias(current_user: AuthUser = Depends(get_current_user)):
    return UserMeResponse(user_id=current_user.user_id, username=current_user.username)
