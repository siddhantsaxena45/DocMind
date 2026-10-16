from pydantic_settings import BaseSettings
import os
import threading
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocMind Advanced RAG Chatbot"
    VERSION: str = "4.0.0"
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Pinecone
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "chatbot")
    
    # Upload constraints
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
    
    # Auth (JWT)
    JWT_SECRET: str = os.getenv("JWT_SECRET", "docmind-super-secure-production-jwt-key-2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 days
    
    def get_google_api_keys(self) -> list[str]:
        keys = [
            os.getenv(f"GOOGLE_API_KEY{i}") for i in range(1, 21) 
            if os.getenv(f"GOOGLE_API_KEY{i}") is not None and os.getenv(f"GOOGLE_API_KEY{i}").strip()
        ]
        if not keys and os.getenv("GOOGLE_API_KEY"):
            keys = [os.getenv("GOOGLE_API_KEY").strip()]
        return keys

class APIKeyRotator:
    def __init__(self):
        self._google_keys = []
        self._google_index = 0
        self.lock = threading.Lock()
        
    def _refresh_keys(self):
        if not self._google_keys:
            self._google_keys = settings.get_google_api_keys()

    def get_rotated_google_keys(self) -> list[str]:
        with self.lock:
            self._refresh_keys()
            if not self._google_keys:
                return []
            rotated = self._google_keys[self._google_index:] + self._google_keys[:self._google_index]
            self._google_index = (self._google_index + 1) % len(self._google_keys)
            return rotated

settings = Settings()
api_key_rotator = APIKeyRotator()
