from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import ensure_schema

from app.api.routes_auth import router as auth_router
from app.api.routes_documents import router as documents_router
from app.api.routes_chat import router as chat_router
from app.api.routes_share import router as share_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_schema()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-Ready RAG and web search",
    lifespan=lifespan
)

# CORS configuration
origins = [o.strip().rstrip("/") for o in settings.CORS_ORIGINS.split(",") if o.strip()]
if "*" in origins or not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core routers
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(share_router)

@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION
    }
