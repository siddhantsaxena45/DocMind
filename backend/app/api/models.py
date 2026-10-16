from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Any

# Authentication
class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)

class LoginRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str

class UserMeResponse(BaseModel):
    user_id: str
    username: str

# Documents
class DocumentItem(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    status: str
    chunk_count: int
    created_at: str
    error_message: Optional[str] = None

class DocumentListResponse(BaseModel):
    documents: List[DocumentItem]

class DocumentUploadResponse(BaseModel):
    message: str
    document_id: str
    filename: str
    chunks: int

# Citations
class Citation(BaseModel):
    title: str
    url: Optional[str] = None
    page: Optional[int] = None
    snippet: Optional[str] = None
    type: str = "doc"  # 'doc' | 'web'

# Messages
class MessageItem(BaseModel):
    id: str
    role: str
    content: str
    sources: List[Citation] = []
    created_at: str

class SendMessageRequest(BaseModel):
    text: str = Field(..., min_length=1)
    web_search: Optional[bool] = None
    selected_doc_ids: Optional[List[str]] = None

class SendMessageResponse(BaseModel):
    message_id: str
    answer: str
    sources: List[Citation]
    conversation_id: str

# Conversations
class ConversationCreate(BaseModel):
    title: Optional[str] = "New Chat"
    selected_doc_ids: Optional[List[str]] = []
    web_search_enabled: Optional[bool] = True

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    selected_doc_ids: Optional[List[str]] = None
    web_search_enabled: Optional[bool] = None

class ConversationItem(BaseModel):
    id: str
    title: str
    selected_doc_ids: List[str] = []
    web_search_enabled: bool = True
    created_at: str
    updated_at: str
    last_message: Optional[str] = None

class ConversationDetailResponse(BaseModel):
    conversation: ConversationItem
    messages: List[MessageItem]

# Sharing
class ShareCreateRequest(BaseModel):
    is_public: Optional[bool] = True

class ShareResponse(BaseModel):
    share_url: str
    share_token: str
    created_at: str

class SharedConversationView(BaseModel):
    share_token: str
    title: str
    created_at: str
    messages: List[MessageItem]
