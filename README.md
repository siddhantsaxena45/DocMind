<div align="center">

# 🧠 DocMind AI

### Enterprise-Grade Conversational Intelligence Platform with Per-Chat Isolated Knowledge Bases, Hybrid RAG, Gemini Vision OCR, Real-Time Web Search & Public Chat Sharing

<p align="center">
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite_7-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python_3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Pinecone_Serverless-000000?style=for-the-badge&logo=pinecone&logoColor=white" alt="Pinecone" />
  <img src="https://img.shields.io/badge/Google_Gemini_2.5-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p align="center">
  <strong>DocMind AI</strong> is a full-stack, production-ready research and document intelligence platform inspired by ChatGPT and Claude. It combines <strong>Per-Chat Dedicated Knowledge Bases</strong>, <strong>Hybrid Vector & Lexical RAG (RRF)</strong>, <strong>Gemini Vision Multimodal OCR</strong>, <strong>Live DuckDuckGo Web Search</strong>, <strong>SSE Token Streaming</strong>, and <strong>Cryptographic Snapshot Sharing</strong>.
</p>

</div>

---

## 📑 Table of Contents

- [Key Architecture & Capabilities](#-key-architecture--capabilities)
  - [1. Per-Chat Isolated Knowledge Bases](#1-per-chat-isolated-knowledge-bases)
  - [2. Advanced Hybrid RAG Engine (RRF)](#2-advanced-hybrid-rag-engine-rrf)
  - [3. Multi-Format Ingestion & Gemini Vision OCR](#3-multi-format-ingestion--gemini-vision-ocr)
  - [4. Real-Time Web Search & Grounded Citations](#4-real-time-web-search--grounded-citations)
  - [5. Server-Sent Events (SSE) Streaming](#5-server-sent-events-sse-streaming)
  - [6. Public Chat Snapshots & Instant Revocation](#6-public-chat-snapshots--instant-revocation)
  - [7. Enterprise Multi-Tenant Security](#7-enterprise-multi-tenant-security)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [REST & Streaming API Reference](#-rest--streaming-api-reference)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Deployment Guide](#-deployment-guide)
  - [Frontend (Vercel SPA Routing)](#frontend-vercel-deployment)
  - [Backend (Render / Railway / VPS)](#backend-deployment)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [License](#-license)

---

## 🌟 Key Architecture & Capabilities

### 1. Per-Chat Isolated Knowledge Bases
- **Context Isolation:** Unlike naive chatbots where all uploaded files are searched globally, DocMind gives **every conversation its own personal knowledge base**.
- **Zero Cross-Chat Bleed:** Chat A discussing `biology_notes.pdf` will never see, retrieve, or hallucinate data from Chat B's `financial_report.xlsx`.
- **Active Document Scope Chips:** Live chips directly above the message input bar show exactly which documents the AI can access, with one-click detaching (`✕`).
- **One-Click Library Attachment:** Effortlessly attach existing documents from your library into the current chat, or upload new files directly into the active conversation.
- **Sidebar Scoping Indicators:** Displays document count badges (`📄 2`) on each conversation item and highlights library documents currently active `in chat`.

### 2. Advanced Hybrid RAG Engine (RRF)
- **Dense Vector Search:** Employs Pinecone Serverless vector indexing with Google Gemini embeddings (`gemini-embedding-001`).
- **Matryoshka Dimension Adapter:** Dynamically adapts embedding vectors down to the exact Pinecone index dimensions (e.g., 1024) while preserving unit L2 normalization.
- **Lexical BM25 Database Retrieval:** Executes full-text term scoring over document paragraphs in PostgreSQL.
- **Reciprocal Rank Fusion (RRF):** Merges dense semantic hits and lexical keyword hits using $RRF(k=60)$ scoring:
  $$RRF\_Score(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$
  Ensures exact keyword matches (part numbers, technical jargon) and high-level conceptual questions both achieve optimal recall.

### 3. Multi-Format Ingestion & Gemini Vision OCR
- **PDF (`.pdf`):** Extracts text page-by-page to generate exact page-level citations (`[Doc: manual.pdf, Page 4]`).
- **Word Documents (`.docx`, `.doc`):** Extracts headings, paragraphs, and structured table data.
- **PowerPoint (`.pptx`, `.ppt`):** Extracts slide text while tracking slide numbering.
- **Excel & Spreadsheets (`.xlsx`, `.xls`, `.csv`):** Converts multi-sheet data into formatted Markdown tables.
- **Images & Scans (`.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`):** Uses Google Gemini 2.5 Flash Multimodal Vision OCR to extract text from handwritten notes, receipts, whiteboard diagrams, and photographed documents.
- **Text & Code (`.txt`, `.md`, `.json`, etc.):** Direct Latin-1/UTF-8 stream parsing with recursive chunking.

### 4. Real-Time Web Search & Grounded Citations
- **DuckDuckGo Live Search:** Instant search retrieval with snippet parsing when the Web Search toggle is active.
- **Anti-Hallucination Grounding:** System prompts enforce strict grounding. Every factual claim is referenced inline:
  - Document sources: `[Doc: filename, Page X]`
  - Web sources: `[Source Title](URL)`
- If evidence is insufficient, DocMind explicitly states what is known and highlights gaps instead of fabricating answers.

### 5. Server-Sent Events (SSE) Streaming
- **Real-Time Token Flow:** Streams tokens with low latency using FastAPI `StreamingResponse` and the native Fetch Streams API.
- **Stop Generation:** AbortController support allows users to instantly stop streaming at any time.
- **Auto-Titling:** After the first user message, Gemini generates a concise 3–5 word title and streams the update to the UI.
- **Response Regeneration:** One-click response regeneration recalculates RAG evidence and produces a fresh answer.

### 6. Public Chat Snapshots & Instant Revocation
- **Secure Share Links:** Generates cryptographically secure public snapshots (`/share/:token`) using URL-safe tokens.
- **Private Data Shield:** Only the conversation transcript is exposed; underlying raw files, vector embeddings, and user credentials remain strictly confidential.
- **Instant Revocation:** Owners can revoke public access with one click, immediately returning `404 Not Found`.
- **Guest Read-Only Viewer:** Dedicated responsive view with Prism code highlighting, copy buttons, and citation links.
- **Vercel SPA Routing:** Pre-configured with `vercel.json` SPA rewrites so direct navigation and refreshes on `/share/:token` load without 404 errors.

### 7. Enterprise Multi-Tenant Security
- **JWT Authentication:** Strict authorization headers (`Bearer <token>`) guarding all API endpoints.
- **PBKDF2 Password Hashing:** Cryptographically salted password protection via Passlib.
- **Pinecone Multi-Tenancy:** Complete vector partition isolation using `namespace = user_id`.
- **Relational Ownership Checks:** Strict row-level validation on every database query.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend (React 19 + Vite 7 + Tailwind v4)"]
        UI["ChatGPT-Style Interface"]
        KB["Chat Knowledge Base Manager"]
        SSE_C["SSE Streaming Reader"]
    end

    subgraph Server["Backend API (FastAPI)"]
        Auth["JWT & PBKDF2 Auth Service"]
        ChatRouter["Conversations & Chat Router"]
        DocRouter["Document Ingestion Router"]
        ShareRouter["Public Snapshot Router"]
    end

    subgraph Intelligence["DocMind Intelligence Engine"]
        Parser["Multi-Format Parser & Vision OCR"]
        RAG["Hybrid RAG Service (RRF k=60)"]
        LLM["Gemini 2.5 LLM Service (Rotator)"]
        WebSearch["DuckDuckGo Live Search"]
    end

    subgraph Storage["Databases & Infrastructure"]
        PG[("PostgreSQL\n(Users, Chats, Docs)")]
        PC[("Pinecone Serverless\n(namespace = user_id)")]
    end

    UI -->|Auth & Prompts| Server
    KB -->|Attach / Detach Docs| ChatRouter
    DocRouter -->|Raw File Ingestion| Parser
    Parser -->|Embeddings| PC
    Parser -->|Metadata & Text| PG
    ChatRouter -->|Retrieve Evidence| RAG
    RAG -->|Vector Search (Filtered)| PC
    RAG -->|BM25 Search (Filtered)| PG
    RAG -->|Web Query| WebSearch
    RAG -->|Unified Context| LLM
    LLM -->|SSE Token Stream| SSE_C
```

---

## 🛠️ Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Framework** | **React 19**, **Vite 7** | High-performance SPA with client-side routing |
| **Styling & UI** | **Tailwind CSS v4**, **Framer Motion**, **Lucide Icons** | Dark-mode interface, glassmorphism, animations |
| **Markdown & Code** | **React Markdown**, **Prism Syntax Highlighter** | Syntax-highlighted code blocks, tables, citations |
| **Backend Framework** | **FastAPI**, **Uvicorn**, **Pydantic v2** | Async REST API & Server-Sent Events streaming |
| **AI Models** | **Google Gemini 2.5 Flash**, **Embedding-001** | LLM synthesis, multi-format vision OCR & embeddings |
| **Vector Storage** | **Pinecone Serverless (AWS us-east-1)** | 1024-dim cosine vector index with user namespaces |
| **Relational Database**| **PostgreSQL (`psycopg2-binary`)** | Users, conversations, document metadata, shared snapshots |
| **Web Search** | **DuckDuckGo Search (`ddgs`)** | Real-time web retrieval for grounding claims |
| **Document Parsers** | **PyPDF, python-docx, openpyxl, Pillow** | Native extraction across PDF, Office, and images |
| **Deployment** | **Vercel** (Frontend), **Render / Railway** (Backend) | Global edge hosting with SPA rewrites |

---

## 📁 Project Structure

```text
DocMind/
├── vercel.json                         # Root Vercel SPA rewrite configuration
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── models.py               # Pydantic v2 validation models
│   │   │   ├── routes_auth.py          # Signup, Login, Me endpoints
│   │   │   ├── routes_chat.py          # Chat CRUD, SSE streaming, regeneration
│   │   │   ├── routes_documents.py     # Upload with chat-scoping, delete, list
│   │   │   └── routes_share.py         # Snapshot link creation, revocation
│   │   ├── core/
│   │   │   ├── auth.py                 # JWT token creation & PBKDF2 hashing
│   │   │   ├── config.py               # Settings & API key rotation manager
│   │   │   └── database.py             # PostgreSQL connection & auto-schema bootstrap
│   │   ├── services/
│   │   │   ├── document_service.py     # Multi-format parser & Gemini Vision OCR
│   │   │   ├── llm_service.py          # Gemini 2.5 Flash caller & SSE generator
│   │   │   ├── rag_service.py          # Chat-scoped Hybrid RAG & RRF reranking
│   │   │   ├── vector_service.py       # Pinecone client & Matryoshka adapter
│   │   │   └── web_search_service.py   # DuckDuckGo live search engine
│   │   └── main.py                     # FastAPI application entry & CORS
│   ├── tests/
│   │   ├── test_rag_chatbot.py         # Multi-tenant isolation & auth tests
│   │   └── test_full_rag_pipeline.py   # Full RAG, parsing, web search, sharing tests
│   ├── requirements.txt                # Python dependencies
│   └── .env                            # Backend configuration variables
└── frontend/
    ├── vercel.json                     # Frontend Vercel SPA routing
    ├── package.json                    # Node dependencies
    ├── vite.config.js                  # Vite 7 build configuration
    └── src/
        ├── App.jsx                     # Root application coordinator & route listener
        ├── api.js                      # Axios/Fetch client wrapper
        ├── auth.js                     # Local session storage helpers
        ├── index.css                   # Tailwind v4 theme & custom utilities
        ├── components/
        │   ├── LoginView.jsx           # Modern authentication screen
        │   ├── SharedChatView.jsx      # Public read-only chat snapshot viewer
        │   ├── ShareModal.jsx          # Link generation & revocation modal
        │   ├── Sidebar.jsx             # Chat history with doc count badges & library
        │   └── UploadModal.jsx         # Drag-and-drop file uploader with chat targeting
        └── features/
            └── Chat/
                └── ChatView.jsx        # Streaming view with active doc chips & citations
```

---

## 📡 REST & Streaming API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user account |
| `POST` | `/api/auth/login` | Authenticate credentials and receive JWT |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |

### 💬 Conversations & Chat (`/api/conversations`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/conversations` | List user conversations with last message preview |
| `POST` | `/api/conversations` | Create a conversation with optional `selected_doc_ids` |
| `GET` | `/api/conversations/{id}` | Get full conversation details and message history |
| `PATCH` | `/api/conversations/{id}` | Rename title, update web search toggle, or update attached docs |
| `DELETE` | `/api/conversations/{id}` | Delete a conversation and its messages |
| `POST` | `/api/conversations/{id}/messages` | Send message (synchronous RAG response) |
| `GET` | `/api/conversations/{id}/messages/stream` | **SSE token stream** with live title & citations |
| `POST` | `/api/conversations/{id}/regenerate` | Regenerate the latest assistant response |

### 📚 Documents & Knowledge Base (`/api/documents`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/documents` | List all documents in the user's library |
| `POST` | `/api/documents/upload` | Upload multi-format files; optionally pass `conversation_id` |
| `DELETE` | `/api/documents/{id}` | Delete document and wipe vectors from Pinecone |

### 🔗 Public Chat Sharing (`/api/share`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/share/{conversation_id}` | Generate a public point-in-time snapshot link |
| `GET` | `/api/share/{share_token}` | Public read-only access to a shared conversation |
| `DELETE` | `/api/share/{share_token}` | Revoke public access (returns `404` immediately) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **Python:** v3.11 or higher
- **PostgreSQL Database:** Supabase, Neon, AWS RDS, or local PostgreSQL
- **Pinecone Account:** An index named `chatbot` (1024 dimension, cosine metric)
- **Google Gemini API Key:** From [Google AI Studio](https://aistudio.google.com/)

---

### 1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows:
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   # Google Gemini API Keys (Supports key rotation: KEY1 to KEY10)
   GOOGLE_API_KEY1="AIzaSyYourGeminiApiKeyHere"

   # PostgreSQL Connection String (Supabase / Neon / Local)
   DATABASE_URL="postgresql://postgres:password@localhost:5432/docmind"

   # Pinecone Serverless Vector DB
   PINECONE_API_KEY="pcsk_your_pinecone_api_key_here"
   PINECONE_INDEX_NAME="chatbot"

   # Security & CORS
   JWT_SECRET="generate-a-secure-random-secret-key-32-chars-minimum"
   CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,https://your-app.vercel.app"
   ```

5. **Start the backend server:**
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - API Root: `http://127.0.0.1:8000/`
   - Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in `frontend/`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
   *(For production deployment on Vercel, set this to your deployed backend URL, e.g. `https://docmind-api.onrender.com`).*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173/`.

---

## 🚢 Deployment Guide

### Frontend (Vercel Deployment)

1. Push your code to GitHub.
2. In Vercel, click **Import Project** and select your repository.
3. Configure the build settings:
   - **Root Directory:** `frontend` (or keep root if running build from root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add the Environment Variable in Vercel:
   - `VITE_API_URL`: Your live backend API URL.
5. **SPA Rewrites:** DocMind includes [`frontend/vercel.json`](file:///d:/DocMind/frontend/vercel.json) to ensure public share links (`/share/:token`) resolve correctly on direct loads and page refreshes:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

### Backend Deployment (Render / Railway / Fly.io)

1. Deploy the `backend/` directory using Python 3.11+.
2. Set the start command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
3. Populate all environment variables from `backend/.env` into your host's dashboard.
4. Ensure your PostgreSQL instance accepts connections from your backend host.

---

## 🧪 Testing & Quality Assurance

DocMind features an end-to-end integration test suite covering:
- Multi-format document parsing & chunking (Text, Markdown, Office, PDF).
- Real-time DuckDuckGo web search retrieval.
- Complete RAG synthesis, token streaming, and citation generation.
- Chat sharing, snapshot generation, and immediate revocation.
- Strict cross-user multi-tenant data isolation.

To run the automated test suite:
```bash
cd backend
python -m pytest tests -v
```

Expected output:
```text
tests/test_full_rag_pipeline.py::test_document_parser_multi_format PASSED
tests/test_full_rag_pipeline.py::test_web_search_service PASSED
tests/test_full_rag_pipeline.py::test_end_to_end_rag_and_sharing_workflow PASSED
tests/test_rag_chatbot.py::test_health_check PASSED
tests/test_rag_chatbot.py::test_auth_workflow PASSED
tests/test_rag_chatbot.py::test_document_and_conversation_isolation PASSED

================== 6 passed in 139.67s ==================
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
