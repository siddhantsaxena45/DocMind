import pytest
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_auth_workflow():
    unique_suffix = pytest.importorskip("uuid").uuid4().hex[:8]
    username = f"testuser_{unique_suffix}"
    password = "SuperSecretPassword123!"

    # 1. Signup
    signup_res = client.post("/api/auth/signup", json={"username": username, "password": password})
    assert signup_res.status_code == 200
    signup_data = signup_res.json()
    assert "access_token" in signup_data
    token = signup_data["access_token"]
    user_id = signup_data["user_id"]

    # 2. Duplicate signup fails
    dup_res = client.post("/api/auth/signup", json={"username": username, "password": password})
    assert dup_res.status_code == 409

    # 3. Login with correct password
    login_res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Login with wrong password fails
    bad_login = client.post("/api/auth/login", json={"username": username, "password": "WrongPassword"})
    assert bad_login.status_code == 401

    # 5. Access /me with token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["user_id"] == user_id
    assert me_res.json()["username"] == username

    # 6. Access /me without token fails
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401

def test_document_and_conversation_isolation():
    uuid = pytest.importorskip("uuid")
    user1 = f"user1_{uuid.uuid4().hex[:6]}"
    user2 = f"user2_{uuid.uuid4().hex[:6]}"
    pwd = "Password123!"

    t1 = client.post("/api/auth/signup", json={"username": user1, "password": pwd}).json()["access_token"]
    t2 = client.post("/api/auth/signup", json={"username": user2, "password": pwd}).json()["access_token"]

    h1 = {"Authorization": f"Bearer {t1}"}
    h2 = {"Authorization": f"Bearer {t2}"}

    # User 1 creates conversation
    c1 = client.post("/api/conversations", json={"title": "User 1 Secret Chat"}, headers=h1).json()
    c1_id = c1["id"]

    # User 2 cannot access or delete User 1's conversation
    forbidden_get = client.get(f"/api/conversations/{c1_id}", headers=h2)
    assert forbidden_get.status_code == 404

    forbidden_del = client.delete(f"/api/conversations/{c1_id}", headers=h2)
    assert forbidden_del.status_code == 404

    # User 1 can share conversation
    share_res = client.post(f"/api/share/{c1_id}", headers=h1)
    assert share_res.status_code == 200
    share_token = share_res.json()["share_token"]

    # Public can view shared conversation
    pub_res = client.get(f"/api/share/{share_token}")
    assert pub_res.status_code == 200
    assert pub_res.json()["title"] == "User 1 Secret Chat"

    # User 2 cannot revoke User 1's share link
    bad_revoke = client.delete(f"/api/share/{share_token}", headers=h2)
    assert bad_revoke.status_code == 404

    # User 1 can revoke share link
    ok_revoke = client.delete(f"/api/share/{share_token}", headers=h1)
    assert ok_revoke.status_code == 200

    # Public view after revoke fails
    after_revoke = client.get(f"/api/share/{share_token}")
    assert after_revoke.status_code == 404
