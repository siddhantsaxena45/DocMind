from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import ensure_schema

from app.api.routes_auth import router as auth_router
from app.api.routes_upload import router as upload_router
from app.api.routes_query import router as query_router
from app.api.routes_documents import router as documents_router
from app.api.routes_ai_tools import router as ai_tools_router

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

@app.on_event("startup")
def _startup():
    ensure_schema()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, tags=["Authentication"])
app.include_router(upload_router, tags=["Upload"])
app.include_router(query_router, tags=["Query / RAG"])
app.include_router(documents_router, tags=["Documents"])
app.include_router(ai_tools_router, tags=["AI Tools"])

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "version": settings.VERSION}
