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
    try:
        ensure_schema()
        print("INFO: Database schema verified and migrated successfully.")
    except Exception as e:
        print(f"WARNING: Database ensure_schema non-blocking notice: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-Ready RAG and web search",
    lifespan=lifespan
)

# CORS configuration
origins = [o.strip().rstrip("/") for o in settings.CORS_ORIGINS.split(",") if o.strip()]
cors_kwargs = {
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if "*" in origins or not origins:
    cors_kwargs["allow_origins"] = ["*"]
    cors_kwargs["allow_credentials"] = False
else:
    cors_kwargs["allow_origins"] = origins
    cors_kwargs["allow_credentials"] = True

app.add_middleware(
    CORSMiddleware,
    **cors_kwargs
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
