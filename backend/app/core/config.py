from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocMind API"
    VERSION: str = "3.0.0"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Pinecone
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "doc-workspace")
    
    # Hugging Face
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", "")
    
    def get_google_api_keys(self) -> list[str]:
        keys = [
            os.getenv(f"GOOGLE_API_KEY{i}") for i in range(1, 10) 
            if os.getenv(f"GOOGLE_API_KEY{i}") is not None
        ]
        if not keys and os.getenv("GOOGLE_API_KEY"):
            keys = [os.getenv("GOOGLE_API_KEY")]
        return keys

    def get_huggingface_api_keys(self) -> list[str]:
        keys = [
            os.getenv(f"HUGGINGFACE_API_KEY{i}") for i in range(1, 10) 
            if os.getenv(f"HUGGINGFACE_API_KEY{i}") is not None
        ]
        if not keys and self.HUGGINGFACE_API_KEY:
            keys = [self.HUGGINGFACE_API_KEY]
        return keys

    # Auth (JWT)
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-only-change-me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # default 7 days

import threading

class APIKeyRotator:
    def __init__(self):
        self._google_keys = []
        self._hf_keys = []
        self._google_index = 0
        self._hf_index = 0
        self.lock = threading.Lock()
        
    def _refresh_keys(self):
        # We don't want to hit os.environ every time, but we need them loaded
        if not self._google_keys:
            self._google_keys = settings.get_google_api_keys()
        if not self._hf_keys:
            self._hf_keys = settings.get_huggingface_api_keys()

    def get_rotated_google_keys(self) -> list[str]:
        with self.lock:
            self._refresh_keys()
            if not self._google_keys:
                return []
            rotated = self._google_keys[self._google_index:] + self._google_keys[:self._google_index]
            self._google_index = (self._google_index + 1) % len(self._google_keys)
            return rotated

    def get_rotated_hf_keys(self) -> list[str]:
        with self.lock:
            self._refresh_keys()
            if not self._hf_keys:
                return []
            rotated = self._hf_keys[self._hf_index:] + self._hf_keys[:self._hf_index]
            self._hf_index = (self._hf_index + 1) % len(self._hf_keys)
            return rotated

api_key_rotator = APIKeyRotator()

settings = Settings()
