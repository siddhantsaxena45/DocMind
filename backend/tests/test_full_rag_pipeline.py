import io
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.web_search_service import web_search_service
from app.services.document_service import document_service

client = TestClient(app)

def test_document_parser_multi_format():
    # 1. Text / Markdown
    txt_bytes = b"# Machine Learning Guide\nMachine learning is a subset of artificial intelligence."
    res_txt = document_service.parse_document(txt_bytes, "guide.md")
    assert "Machine learning" in res_txt.full_text

    # 2. Text Chunking
    chunks = document_service.chunk_document(res_txt, user_id="user_123", filename="guide.md", document_id="doc_123")
    assert len(chunks) >= 1
    assert chunks[0].metadata["filename"] == "guide.md"
    assert chunks[0].metadata["page"] == 1

def test_web_search_service():
    results = web_search_service.search("Python programming language", max_results=3)
    assert isinstance(results, list)
    if results:
        assert "url" in results[0]
        assert "title" in results[0]
        assert results[0]["type"] == "web"

def is_db_available() -> bool:
    try:
        from app.core.database import get_db_conn
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.close()
        conn.close()
        return True
    except Exception:
        return False

@pytest.mark.skipif(not is_db_available(), reason="Database connection not available in CI environment")
def test_end_to_end_rag_and_sharing_workflow():
    uid1 = uuid.uuid4().hex[:8]
    username1 = f"user_{uid1}"
    password = "SecurePassword123!"

    # 1. Signup & Login
    signup_res = client.post("/api/auth/signup", json={"username": username1, "password": password})
    assert signup_res.status_code == 200
    token1 = signup_res.json()["access_token"]
    user1_id = signup_res.json()["user_id"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # 2. Upload Document
    doc_content = (
        b"Quantum Computing Report 2026.\n"
        b"Superconducting qubits operate at millikelvin temperatures.\n"
        b"The coherence time has improved to 1.5 milliseconds in recent benchmarks."
    )
    files = [("files", ("quantum_report.txt", io.BytesIO(doc_content), "text/plain"))]
    upload_res = client.post("/api/documents/upload", files=files, headers=headers1)
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert len(upload_data["documents"]) == 1
    doc_id = upload_data["documents"][0]["document_id"]

    # Verify document listed
    doc_list_res = client.get("/api/documents", headers=headers1)
    assert doc_list_res.status_code == 200
    docs = doc_list_res.json()["documents"]
    assert any(d["id"] == doc_id for d in docs)

    # 3. Create Conversation
    conv_res = client.post(
        "/api/conversations",
        json={"title": "New Chat", "selected_doc_ids": [doc_id], "web_search_enabled": True},
        headers=headers1
    )
    assert conv_res.status_code == 200
    conv_id = conv_res.json()["id"]

    # 4. Send Message (RAG + Synthesis)
    msg_res = client.post(
        f"/api/conversations/{conv_id}/messages",
        json={"text": "What temperature do superconducting qubits operate at and what is the coherence time?"},
        headers=headers1
    )
    assert msg_res.status_code == 200
    msg_data = msg_res.json()
    assert "answer" in msg_data
    assert "sources" in msg_data
    # Verify citations returned
    assert len(msg_data["sources"]) > 0

    # 5. Check Conversation details & auto-titling
    detail_res = client.get(f"/api/conversations/{conv_id}", headers=headers1)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert len(detail_data["messages"]) >= 2  # user and assistant
    # Conversation title should have been updated from "New Chat"
    assert detail_data["conversation"]["title"] != ""

    # 6. Regenerate response
    regen_res = client.post(f"/api/conversations/{conv_id}/regenerate", headers=headers1)
    assert regen_res.status_code == 200
    assert "answer" in regen_res.json()

    # 7. Share conversation
    share_res = client.post(f"/api/share/{conv_id}", headers=headers1)
    assert share_res.status_code == 200
    share_token = share_res.json()["share_token"]

    # Public view
    pub_res = client.get(f"/api/share/{share_token}")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert len(pub_data["messages"]) >= 2
    assert pub_data["share_token"] == share_token

    # 8. Cross-User Isolation: User 2 tries to access User 1's conversation and document
    uid2 = uuid.uuid4().hex[:8]
    username2 = f"user_{uid2}"
    signup2 = client.post("/api/auth/signup", json={"username": username2, "password": password})
    token2 = signup2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User 2 cannot list User 1's documents
    u2_docs = client.get("/api/documents", headers=headers2).json()["documents"]
    assert not any(d["id"] == doc_id for d in u2_docs)

    # User 2 cannot access User 1's conversation
    u2_conv_get = client.get(f"/api/conversations/{conv_id}", headers=headers2)
    assert u2_conv_get.status_code == 404

    # User 2 cannot delete User 1's document
    u2_del_doc = client.delete(f"/api/documents/{doc_id}", headers=headers2)
    assert u2_del_doc.status_code == 404

    # 9. Revoke share link
    revoke_res = client.delete(f"/api/share/{share_token}", headers=headers1)
    assert revoke_res.status_code == 200

    # Public view after revocation fails
    revoked_view = client.get(f"/api/share/{share_token}")
    assert revoked_view.status_code == 404

    # 10. Clean up User 1 document and conversation
    del_doc_res = client.delete(f"/api/documents/{doc_id}", headers=headers1)
    assert del_doc_res.status_code == 200
    del_conv_res = client.delete(f"/api/conversations/{conv_id}", headers=headers1)
    assert del_conv_res.status_code == 200
