<div align="center">
  <h1>🧠 DocMind AI</h1>
  <p><strong>Production-Ready, GPT-like Advanced RAG Chatbot with Real-Time Web Search & Multi-Format Document Intelligence</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite_7-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python_3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Pinecone-000000?style=for-the-badge&logo=pinecone&logoColor=white" alt="Pinecone" />
    <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
  </p>
</div>

<br />

**DocMind AI** is an advanced, production-ready conversational intelligence platform inspired by ChatGPT. It combines **Hybrid RAG** (Pinecone vector search + lexical keyword search + Reciprocal Rank Fusion), **Real-Time Web Search**, **Multi-Format Document Parsing & Vision OCR**, **Token Streaming (SSE)**, and **Secure Chat Sharing** with strict user-level data isolation.

---

## 🌟 Key Features

### 💬 GPT-like Conversational Experience
- **Persistent Multi-Conversations:** Seamlessly create, rename, search, and delete conversations.
- **Server-Sent Events (SSE) Streaming:** Real-time token streaming with stop-generation support.
- **Intelligent Auto-Titling:** Automatically summarizes user prompts into 3–5 word titles.
- **Regenerate & Copy:** One-click response regeneration and code/message clipboard copying.
- **Rich Markdown Formatting:** Formats syntax-highlighted code blocks, tables, lists, and bold text.

### 📚 Advanced Hybrid RAG Engine
- **Multi-Format Ingestion:**
  - **PDF (`.pdf`):** Page-accurate text extraction and link parsing with exact page citations.
  - **Word (`.docx`, `.doc`):** Paragraph and table extraction with fallback parsing.
  - **PowerPoint (`.pptx`, `.ppt`):** Slide-by-slide text extraction with slide number tracking.
  - **Excel (`.xlsx`, `.xls`, `.csv`):** Tabular data extraction into markdown tables.
  - **Images (`.png`, `.jpg`, `.jpeg`, `.webp`):** Multimodal Vision OCR via Google Gemini (`gemini-2.5-flash`), extracting text from scans, receipts, diagrams, and handwriting.
  - **Text & Code (`.txt`, `.md`, `.json`, etc.):** Direct UTF-8 / Latin-1 text decode.
- **Hybrid Retrieval (RRF):** Dense semantic search combined with lexical keyword retrieval merged via **Reciprocal Rank Fusion (RRF)** and reranking.
- **Matryoshka Embeddings Adapter:** Automatically adapts Google Gemini embeddings down to index dimensions (e.g. 1024) while preserving unit L2 normalization.

### 🌐 Real-Time Web Search & Verification
- **Live DuckDuckGo Search:** Fetches real-world information, search snippets, and URLs when toggled ON.
- **Strict Anti-Hallucination Grounding:** All claims are attributed to document pages (`[Doc: filename, Page X]`) or web sources (`[Web: title](url)`). If evidence is insufficient, uncertainty is acknowledged.

### 🔗 Secure Chat Sharing & Public Snapshots
- **Shareable Links:** Generates point-in-time snapshot URLs (`/share/{token}`) without exposing private documents or account credentials.
- **Instant Revocation:** Conversation owners can revoke public share links at any time (`404` access denied immediately).
- **Read-Only Snapshot Viewer:** Dedicated, responsive view for guests with code highlighting and citations.

### 🛡️ Enterprise Security & Data Isolation
- **JWT Authentication:** Strict authorization on all API routes (`/api/*`).
- **Pinecone Namespace Isolation:** Documents and vector embeddings are partitioned into `namespace = user_id`.
- **Relational Integrity:** Row-level ownership validation on every conversation, document, and message query.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS v4, Framer Motion, Lucide React, React Markdown, React Syntax Highlighter |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, PyJWT, Passlib (PBKDF2) |
| **AI / Embeddings** | Google Gemini (`gemini-2.5-flash`, `gemini-embedding-001`), LangChain Core |
| **Vector Database** | Pinecone Serverless (Cosine Metric, 1024 Dimensions) |
| **Relational Database** | PostgreSQL (`psycopg2-binary`) with automated schema bootstrap |
| **Web Search** | DuckDuckGo Search (`ddgs`), HTTP fallback |
| **Document Parsers** | PyPDF, python-docx, openpyxl, Pillow, Gemini Multimodal Vision |

---

## 📁 Project Structure

```text
DocMind/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── models.py               # Pydantic v2 request/response schemas
│   │   │   ├── routes_auth.py          # Signup, Login, Me endpoints
│   │   │   ├── routes_chat.py          # Conversations, Messages, SSE Stream, Regenerate
│   │   │   ├── routes_documents.py     # Multi-file upload, list, delete
│   │   │   └── routes_share.py         # Share link creation, public snapshot, revoke
│   │   ├── core/
│   │   │   ├── auth.py                 # JWT generation, PBKDF2 hashing, dependencies
│   │   │   ├── config.py               # Settings & Google API key rotator
│   │   │   └── database.py             # PostgreSQL connection & auto-migration
│   │   ├── services/
│   │   │   ├── document_service.py     # Multi-format parser & Vision OCR
│   │   │   ├── llm_service.py          # Gemini LLM invocation & SSE token streaming
│   │   │   ├── rag_service.py          # Hybrid search, RRF reranking, citation assembly
│   │   │   ├── vector_service.py       # Pinecone client & Matryoshka dimension adapter
│   │   │   └── web_search_service.py   # DuckDuckGo live search engine
│   │   └── main.py                     # FastAPI application & lifespan setup
│   ├── tests/
│   │   ├── test_rag_chatbot.py         # Auth, isolation, and health tests
│   │   └── test_full_rag_pipeline.py   # Full RAG, web search, sharing, and parsing tests
│   ├── requirements.txt                # Production dependencies
│   └── .env                            # Backend environment configuration
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── LoginView.jsx           # Modern auth interface
    │   │   ├── SharedChatView.jsx      # Public shared chat viewer
    │   │   ├── ShareModal.jsx          # Share link generator & revocation modal
    │   │   ├── Sidebar.jsx             # ChatGPT-style searchable sidebar & document manager
    │   │   └── UploadModal.jsx         # Multi-format drag-and-drop file upload
    │   ├── features/
    │   │   └── Chat/
    │   │       └── ChatView.jsx        # Streaming chat container with citations & markdown
    │   ├── api.js                      # Unified API client
    │   ├── auth.js                     # Local session storage helpers
    │   ├── App.jsx                     # Root application coordinator
    │   └── index.css                   # Tailwind v4 styles & theme design
    ├── package.json                    # Node dependencies
    └── vite.config.js                  # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v18+
- **Python:** v3.11+
- **PostgreSQL Database:** Supabase, Neon, or local PostgreSQL
- **Pinecone Account:** Index named `chatbot` (1024 dimension, cosine)
- **Google Gemini API Key:** From [Google AI Studio](https://aistudio.google.com/)

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Environment Variables (`backend/.env`):
```env
# Google Gemini (Supports key rotation: GOOGLE_API_KEY1 to GOOGLE_API_KEY10)
GOOGLE_API_KEY1="your_gemini_api_key"

# PostgreSQL (Supabase / Neon / Local)
DATABASE_URL="postgresql://user:password@host:5432/postgres"

# Pinecone
PINECONE_API_KEY="your_pinecone_api_key"
PINECONE_INDEX_NAME="chatbot"

# Auth & Security
JWT_SECRET="your-secure-jwt-secret-key"
CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,https://your-frontend.vercel.app"
```

#### Run Backend Server:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API documentation: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Access the application at `http://localhost:5173/`.

---

## 🧪 Testing

Run the automated integration test suite covering authentication, multi-format parsing, Pinecone vector upserts, hybrid RAG queries, web search synthesis, auto-titling, chat sharing, and cross-user data isolation:

```bash
cd backend
python -m pytest tests -v
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
