from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db_conn

from app.services.pdf_service import pdf_service
from app.ai_features.summarizer import summarizer_feature
from app.ai_features.document_authenticity import authenticity_checker
from app.ai_features.image_generation import image_generator
from app.ai_features.code_generation import code_generator
from app.ai_features.knowledge_graph import knowledge_graph_builder
from app.ai_features.flashcard_generator import flashcard_generator
from app.ai_features.research_agent import research_agent
from app.ai_features.source_credibility import credibility_evaluator
import json

router = APIRouter()

def _raise_ai_http_error(e: Exception) -> None:
    """
    Normalize upstream LLM/tooling errors into stable HTTP codes for the frontend.
    """
    msg = str(e)
    low = msg.lower()
    # Gemini quotas / rate limits
    if "resource_exhausted" in low or "quota" in low or "rate limit" in low or "429" in low:
        raise HTTPException(status_code=429, detail="AI quota/rate limit hit. Please try again shortly.")
    # Gemini transient overload / high demand
    if "high demand" in low or "unavailable" in low or "try again later" in low or "503" in low:
        raise HTTPException(status_code=503, detail="AI model is temporarily overloaded. Please try again later.")
    # Invalid/expired key (misconfiguration)
    if "api key expired" in low or "api_key_invalid" in low or "invalid api key" in low:
        raise HTTPException(status_code=503, detail="AI provider credentials invalid/expired. Update your API key(s).")


class ImageRequest(BaseModel):
    prompt: str

class CodeRequest(BaseModel):
    request: str
    context: Optional[str] = ""

class ResearchRequest(BaseModel):
    topic: str

def get_document_text(document_id: str, user_id: str) -> str:
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT full_text FROM documents WHERE id = %s AND user_id = %s", (document_id, user_id))
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row or not row[0]:
        raise HTTPException(status_code=404, detail="Document text not found. Please re-upload the document.")
        
    return row[0]


def _cache_get(user_id: str, document_id: str, feature: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT payload FROM document_feature_cache WHERE user_id = %s AND document_id = %s AND feature = %s",
        (user_id, document_id, feature),
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    
    if row and row[0]:
        try:
            return json.loads(row[0]) if isinstance(row[0], str) else row[0]
        except json.JSONDecodeError:
            return row[0]
    return None


def _cache_set(user_id: str, document_id: str, feature: str, payload):
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO document_feature_cache (user_id, document_id, feature, payload, updated_at)
            VALUES (%s, %s, %s, %s, now())
            ON CONFLICT (user_id, document_id, feature)
            DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
            """,
            (user_id, document_id, feature, json.dumps(payload)),
        )
        conn.commit()
        cur.close(); conn.close()
    except Exception as e:
        # If the document was deleted during the AI process, caching will fail due to FK violation.
        # This is expected in race conditions; we just log and ignore.
        print(f"Non-critical: Cache insertion ignored (likely document deleted): {e}")

@router.post("/document/{document_id}/insights")
def get_insights(document_id: str, user_id: str = Query(...), force: bool = Query(False)):
    try:
        if not force:
            cached = _cache_get(user_id, document_id, "insights")
            if cached is not None:
                return {"insights": cached, "cached": True}
        text = get_document_text(document_id, user_id)
        data = summarizer_feature.generate_document_intelligence(text)
        _cache_set(user_id, document_id, "insights", data)
        return {"insights": data}
    except Exception as e:
        _raise_ai_http_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/document/{document_id}/verify")
def verify_document(document_id: str, user_id: str = Query(...), force: bool = Query(False)):
    try:
        if not force:
            cached = _cache_get(user_id, document_id, "verify")
            if cached is not None:
                cached["cached"] = True
                return cached
        text = get_document_text(document_id, user_id)
        res = authenticity_checker.verify_document(text)
        _cache_set(user_id, document_id, "verify", res)
        return res
    except Exception as e:
        _raise_ai_http_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/document/{document_id}/graph")
def get_graph(document_id: str, user_id: str = Query(...), force: bool = Query(False)):
    try:
        if not force:
            cached = _cache_get(user_id, document_id, "graph")
            if cached is not None:
                return {"graph": cached, "cached": True}
        text = get_document_text(document_id, user_id)
        graph = knowledge_graph_builder.build_graph(text)
        _cache_set(user_id, document_id, "graph", graph)
        return {"graph": graph}
    except Exception as e:
        _raise_ai_http_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/document/{document_id}/flashcards")
def get_flashcards(document_id: str, user_id: str = Query(...), force: bool = Query(False)):
    try:
        if not force:
            cached = _cache_get(user_id, document_id, "flashcards")
            if cached is not None:
                return {"flashcards": cached, "cached": True}
        text = get_document_text(document_id, user_id)
        cards = flashcard_generator.generate_flashcards(text)
        _cache_set(user_id, document_id, "flashcards", cards)
        return {"flashcards": cards}
    except Exception as e:
        _raise_ai_http_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tools/image")
async def generate_image(req: ImageRequest):
    try:
        img_data = await image_generator.generate_image(req.prompt)
        return {"image_data": img_data}
    except Exception as e:
        _raise_ai_http_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tools/code")
def generate_code(req: CodeRequest, document_id: Optional[str] = None, user_id: Optional[str] = None):
    try:
        context = req.context
        if document_id and user_id:
            try:
                context = get_document_text(document_id, user_id)
            except Exception:
                pass
        code = code_generator.generate_code(req.request, context)
        return {"code": code}
    except Exception as e:
        _raise_ai_http_error(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tools/research")
def research_topic(req: ResearchRequest):
    try:
        res = research_agent.research(req.topic)
        # Unique: Perform automatic credibility check on the sources
        try:
            sources = res.get("sources", [])
            if sources:
                res["credibility"] = credibility_evaluator.evaluate_sources(sources)
        except Exception as e:
            print(f"Non-critical error in credibility analysis: {e}")
        return res
    except Exception as e:
        _raise_ai_http_error(e)
        raise HTTPException(status_code=500, detail=str(e))
