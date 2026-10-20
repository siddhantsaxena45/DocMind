<div align="center">

# 🧠 DocMind AI

### State-of-the-Art Agentic Document Intelligence & Real-Time Research Engine
**Perplexity-Style Interface • Universal Multi-Doc Inline Hyperlinks • Context-Aware Verification Search • Live URL Inspection • Hybrid RRF • 100% Free-Tier Architecture**

<p align="center">
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite_7-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python_3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/Supabase_PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Pinecone_Serverless-000000?style=for-the-badge&logo=pinecone&logoColor=white" alt="Pinecone" />
  <img src="https://img.shields.io/badge/Google_Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p align="center">
  <strong>DocMind AI</strong> is an advanced research and document intelligence platform modeled after <strong>Perplexity AI</strong>. It combines <strong>Per-Chat Isolated Knowledge Bases</strong>, <strong>Universal Inline Hyperlink Parsing across all document formats</strong>, <strong>Autonomous Live URL Scraping & Inspection</strong>, <strong>Context-Aware Claim Verification</strong>, <strong>Hybrid Vector & Lexical RAG (RRF)</strong>, <strong>Gemini Multimodal OCR</strong>, <strong>Free DuckDuckGo Web Search</strong>, and <strong>Automated Multi-Key API Rotation</strong>.
</p>

</div>

---

## 📑 Table of Contents

- [🌟 Core Capabilities & Agentic Features](#-core-capabilities--agentic-features)
  - [1. Perplexity-Style Research Experience](#1-perplexity-style-research-experience)
  - [2. Universal Inline Hyperlink Parsing Across ALL Document Types](#2-universal-inline-hyperlink-parsing-across-all-document-types)
  - [3. Context-Aware Verification Search](#3-context-aware-verification-search)
  - [4. Autonomous Live URL Inspection & Code Verification](#4-autonomous-live-url-inspection--code-verification)
  - [5. Hybrid Search Pipeline (Vector + BM25 + RRF)](#5-hybrid-search-pipeline-vector--bm25--rrf)
  - [6. Multi-Key API Key Rotation (100% Free Tier Resilient)](#6-multi-key-api-key-rotation-100-free-tier-resilient)
  - [7. Per-Chat Isolated Knowledge Bases](#7-per-chat-isolated-knowledge-bases)
  - [8. Row-Level Security (RLS) & Multi-Tenant Shield](#8-row-level-security-rls--multi-tenant-shield)
- [🏗️ System Architecture & Workflow Pipeline](#️-system-architecture--workflow-pipeline)
- [💻 Technology Stack](#-technology-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Quickstart & Installation](#-quickstart--installation)
  - [Prerequisites](#prerequisites)
  - [1. Environment Configuration](#1-environment-configuration)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [🌐 Deployment Guide](#-deployment-guide)
  - [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
  - [Backend Deployment (Render / Railway / VPS)](#backend-deployment-render--railway--vps)
  - [Database Setup (Supabase)](#database-setup-supabase)
- [📡 API & Streaming Reference](#-api--streaming-reference)
- [📄 License & Author](#-license--author)

---

## 🌟 Core Capabilities & Agentic Features

### 1. Perplexity-Style Research Experience
- **Collapsible Research Status Bar:** Displays the distilled research topic (e.g. `Researched Siddhant Saxena & Projects`), execution checkmark, total sources count, and an **overlapping stacked favicon pill stack** `(O)(M)(R) +6`.
- **Perplexity Source Cards Carousel:** Horizontally scrollable row of sleek dark cards with high-resolution domain favicons (via Google Favicon CDN), subreddit pills (`💬 r/Twitch`, `💬 r/youtube`), document page markers (`p.1`), 2-line title clamps, and a `View all →` modal drawer.
- **Rich Markdown Tables & Key Takeaways:** Automatically synthesizes comparisons, metrics, financial breakdowns, and verification statuses into clean GitHub Flavored Markdown (GFM) tables with alternating row highlights and bold `**Key takeaway:**` callouts.
- **Interactive Follow-up Question Pills:** Dynamically generates 3–4 contextually relevant follow-up questions formatted with curved reply arrows (`↳ Elaborate`, `↳ Compare with...`) that submit on click.
- **Action Toolbar:** One-click copy with feedback icon, Try Again / Regenerate, and Thumbs Up / Down ratings.

### 2. Universal Inline Hyperlink Parsing Across ALL Document Types
In standard RAG systems, embedded hyperlinks in documents are completely lost during text extraction. DocMind solves this universally:
- **PDFs & LaTeX / Overleaf (`.pdf`):** Extracts PDF annotation objects (`/Annots` $\to$ `/Subtype == /Link` $\to$ `/A` $\to$ `/URI`) and inlines them directly into the respective page text (`[Page 1 Embedded Links: ...]`). Page chunks in Pinecone retain all clickable URLs.
- **Word Documents (`.docx`):** Parses OpenXML relationship trees (`word/_rels/document.xml.rels`), mapping relationship IDs (`rIdX`) to target URLs and inlines `<w:hyperlink>` elements as `[Text](url)`.
- **PowerPoint Decks (`.pptx`):** Inspects slide relationships (`slideN.xml.rels`) to preserve slide-level hyperlinks and plaintext URLs.
- **Excel Spreadsheets (`.xlsx`):** Inspects `cell.hyperlink.target` and inlines links next to cell values (`Value (https://...)`).
- **Plaintext & Markdown (`.txt`, `.md`, `.csv`):** Extracts Markdown syntax `[title](url)` and plaintext domain handles (GitHub, LinkedIn, LeetCode, Kaggle, HuggingFace).
- **Scanned Images & Receipts (`.png`, `.jpg`, `.webp`):** Uses Google Gemini 2.5 Flash Multimodal Vision OCR to extract text and links from image files.

### 3. Context-Aware Verification Search
When a user asks to *"verify his claims on internet"*, *"check his resume on google"*, or *"audit this company"*:
- **No More Naive Prompts:** A basic chatbot searches the literal words *"verify his claims on internet"* on DuckDuckGo and gets generic HR articles.
- **Targeted Entity Formulation:** DocMind reads the retrieved document context, identifies proper nouns, usernames, and projects (e.g. `Siddhant Saxena`, `Jaypee Institute`, `DocMind`, `SidCode.AI`), and autonomously formulates **1 to 3 surgical search queries** (e.g. `'Siddhant Saxena' 'Jaypee Institute'`, `'siddhantsaxena45' github`, `'SidCode.AI'`).
- **Multi-Query Deduplicated Search:** Executes searches in parallel, deduplicating by URL and attaching live domain favicons.

### 4. Autonomous Live URL Inspection & Code Verification
- **Deep Web Fetcher (`fetch_url_content`):** The backend physically connects to and fetches the live web page HTML for links found in the document (GitHub profiles, live project URLs, portfolios).
- **GitHub Profile & Repository Parsing:** Automatically extracts public repository names, project descriptions, programming languages, and GitHub bio.
- **Live Claims Cross-Examination:** Compares claims made in the document (e.g. *"Developed DocMind RAG using FastAPI and Pinecone"*) against what is live in the candidate's GitHub repositories, producing a structured verification report.

### 5. Hybrid Search Pipeline (Vector + BM25 + RRF)
- **Dense Vector Search:** 768-dimensional semantic embeddings generated via Google `text-embedding-004` stored in Pinecone Serverless.
- **Sparse BM25 Keyword Search:** Full-text lexical search querying PostgreSQL paragraphs to guarantee exact matches on project names, acronyms, and technical terms.
- **Reciprocal Rank Fusion (RRF):** Fuses both ranks with $RRF(k=60)$ scoring:
  $$RRF\_Score(d) = \sum_{m \in M} \frac{1}{60 + r_m(d)}$$

### 6. Multi-Key API Key Rotation (100% Free Tier Resilient)
- **Zero Cost Architecture:** Built entirely on free-tier services (Google Gemini API free tier, Pinecone serverless free tier, Supabase free PostgreSQL, DuckDuckGo free search).
- **Thread-Safe Round-Robin Key Rotator:** Reads `GOOGLE_API_KEY1` through `GOOGLE_API_KEY20`. Every request shifts to the next key.
- **Automatic 429 Recovery:** If a Google API key hits a rate limit or resource exhaustion (`RESOURCE_EXHAUSTED` / `429`), DocMind catches the error and retries the next key in the pool with zero downtime.

### 7. Per-Chat Isolated Knowledge Bases
- **Zero Cross-Chat Bleed:** Files uploaded to Chat A belong exclusively to Chat A. Chat B cannot see, retrieve, or cite them.
- **Scoping Chips:** Interactive document chips above the input bar show active files, allowing one-click attachment or removal (`✕`).
- **Empty State Guard:** If a chat has zero documents attached, DocMind prompts the user to attach documents rather than hallucinating answers.

### 8. Row-Level Security (RLS) & Multi-Tenant Shield
- All core Supabase PostgreSQL tables (`users`, `documents`, `conversations`, `messages`, `shared_conversations`) are protected with **Row Level Security (RLS)**.
- Unauthorized public access via PostgREST / Supabase URLs is strictly denied.
- Passwords hashed using cryptographically salted PBKDF2/bcrypt via Passlib.
- Endpoints secured with short-lived JWT tokens (`HS256`).

---

## 🏗️ System Architecture & Workflow Pipeline

```text
[ User Uploads Document: PDF / DOCX / PPTX / XLSX / Image ]
                           │
                           ▼
     [ Universal Document Parser (document_service.py) ]
     ├─ Extracts text page-by-page
     ├─ Extracts PDF /Annots /URI hyperlinks
     ├─ Extracts Word rels (document.xml.rels)
     ├─ Inlines [Page X Embedded Links: ...] into text
     └─ Gemini Multimodal Vision OCR (for images)
                           │
                           ▼
           [ Recursive Chunking (800 / 120) ]
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
   [ Pinecone Serverless ]      [ Supabase PostgreSQL ]
    Dense Vector Indexing        Full Text & Metadata
    (User Isolated Namespace)    (Row Level Security)

──────────────────────────────────────────────────────────

[ User Asks Question / "Verify his claims on internet" ]
                           │
                           ▼
          [ Hybrid Search Engine (RRF k=60) ]
     ├─ Dense Vector Search (Pinecone)
     ├─ Keyword Search (PostgreSQL)
     └─ Reciprocal Rank Fusion Merging
                           │
                           ▼
      [ Context-Aware Verification & Link Inspector ]
     ├─ Detects verification intent (is_verification_query)
     ├─ Formulates targeted queries ("Siddhant Saxena" github)
     ├─ Executes multi-query DuckDuckGo search
     └─ Deep Web Fetcher visits candidate GitHub & live URLs
                           │
                           ▼
          [ LLM Synthesis (Gemini 2.5 Flash) ]
     ├─ Rotates API Keys (Key 1 → Key 20)
     ├─ Synthesizes Markdown comparison tables & callouts
     ├─ Cites inline: [Doc: file, Page X] and [Title](URL)
     └─ Generates 3-4 interactive follow-up questions
                           │
                           ▼
    [ Server-Sent Events (SSE) Streaming to React UI ]
     ├─ event: research  (Status bar & Favicons stack)
     ├─ event: citations (Perplexity source cards)
     ├─ event: chunk     (Real-time token stream)
     └─ event: related   (Follow-up suggestion pills)
```

---

## 💻 Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + Vite** | Fast Single Page Application with optimized bundle splitting |
| **Styling & Theme** | **Tailwind CSS + Vanilla CSS** | Curated dark-mode theme, glassmorphism, responsive drawers |
| **Icons & Typography** | **Lucide React + Outfit/Inter** | Modern UI iconography and clean typography |
| **Streaming Client** | **Server-Sent Events (`EventSource`)** | Low-latency token streaming with dedicated event handlers |
| **Backend Framework** | **FastAPI (Python 3.11+)** | High-performance asynchronous REST & streaming API |
| **Language Model** | **Google Gemini 2.5 Flash** | Advanced reasoning, multimodal OCR, and query planning |
| **Vector Database** | **Pinecone Serverless** | 768-dim similarity search with user namespace partitioning |
| **Embeddings** | **Google text-embedding-004** | High-precision semantic vector representations |
| **Primary Database** | **Supabase (PostgreSQL 15)** | Relational storage with enabled Row-Level Security (RLS) |
| **Document Parsers** | **PyPDF, python-docx, openpyxl** | Parsing PDF annotations, Word XML rels, and Excel cells |
| **Web Search** | **DuckDuckGo API (`ddgs`) + httpx** | 100% free search engine with HTML fallback |
| **Live Web Fetcher** | **httpx (Async HTTP Client)** | Autonomous live webpage and GitHub repository scraper |
| **Favicon Engine** | **Google S2 Favicon CDN** | Dynamic 64px website favicons for any domain |
| **Security & Auth** | **JWT (python-jose) + Passlib** | Stateless token auth with PBKDF2 password hashing |

---

## 📁 Project Structure

```text
DocMind/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── models.py            # Pydantic schemas (Citation, Message, Conversation)
│   │   │   ├── routes_auth.py       # User registration, login, JWT issuance
│   │   │   ├── routes_chat.py       # Chat endpoints & SSE streaming (/stream)
│   │   │   ├── routes_documents.py  # Document upload, chunking, and deletion
│   │   │   └── routes_share.py      # Public snapshot viewer and revocation
│   │   ├── core/
│   │   │   ├── auth.py              # JWT verification and user dependency
│   │   │   ├── config.py            # Pydantic settings & APIKeyRotator (20 keys)
│   │   │   └── database.py          # PostgreSQL connection & RLS migration
│   │   ├── services/
│   │   │   ├── document_service.py  # Universal link parser (PDF, DOCX, PPTX, XLSX)
│   │   │   ├── llm_service.py       # Gemini 2.5 Flash, verification queries, followups
│   │   │   ├── rag_service.py       # Hybrid retrieval (Vector + BM25 + RRF)
│   │   │   ├── vector_service.py    # Pinecone vector index manager
│   │   │   └── web_search_service.py# DuckDuckGo search & Deep Web URL fetcher
│   │   └── main.py                  # FastAPI application entrypoint & CORS
│   ├── requirements.txt             # Python dependencies
│   └── run.py                       # Local uvicorn development launcher
├── frontend/
│   ├── src/
│   │   ├── components/              # Sidebar, LoginView, SharedChatView
│   │   ├── features/Chat/
│   │   │   ├── ChatView.jsx         # Main chat screen with action bar & SSE receiver
│   │   │   ├── ResearchStatusBar.jsx# Collapsible research bar with stacked favicons
│   │   │   ├── SourceCardsCarousel.jsx # Perplexity-style horizontal source cards
│   │   │   ├── MarkdownTableRenderer.jsx # Custom GFM table & code block renderer
│   │   │   ├── FollowupQuestions.jsx# Interactive follow-up question pills
│   │   │   └── AllSourcesModal.jsx  # Full source details drawer
│   │   ├── services/                # API client & SSE stream connection
│   │   ├── App.jsx                  # Root state & authenticated view routing
│   │   └── main.jsx                 # React root mounting
│   ├── package.json                 # Frontend dependencies
│   └── vite.config.js               # Vite build configuration
├── vercel.json                      # Vercel SPA routing rewrites
└── README.md                        # Documentation
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** & npm installed
- A free **Supabase** account (PostgreSQL)
- A free **Pinecone** account (Serverless index, dimension `768`, metric `cosine`)
- One or more free **Google Gemini API keys** from Google AI Studio

---

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Project Info
PROJECT_NAME="DocMind AI"
VERSION="4.0.0"
CORS_ORIGINS="http://localhost:5173,http://localhost:3000,https://your-frontend.vercel.app"

# Database (Supabase PostgreSQL URL)
DATABASE_URL="postgresql://postgres:your_password@db.your_project.supabase.co:5432/postgres"

# Pinecone Vector Database
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX_NAME="chatbot"

# Google Gemini API Keys (Supports up to 20 keys for automated rotation)
GOOGLE_API_KEY1="AIzaSyYourFirstKey"
GOOGLE_API_KEY2="AIzaSyYourSecondKey"
GOOGLE_API_KEY3="AIzaSyYourThirdKey"
GOOGLE_API_KEY="AIzaSyYourDefaultKey"

# Security & Limits
JWT_SECRET="generate-a-strong-secret-key-32-chars-min"
JWT_ALGORITHM="HS256"
JWT_EXPIRE_MINUTES="10080"
MAX_UPLOAD_SIZE_MB="50"
```

In the `frontend/` directory, create `.env`:

```env
VITE_API_URL="http://localhost:8000"
```

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python run.py
```
The FastAPI backend will start on **`http://localhost:8000`** with interactive docs at `http://localhost:8000/docs`.

---

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🌐 Deployment Guide

### Frontend Deployment (Vercel)
1. Push your code to GitHub.
2. In the Vercel dashboard, click **Add New Project** and select your `DocMind` repository.
3. Configure the build settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add the Environment Variable in Vercel:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://docmind-backend.onrender.com`).
5. Click **Deploy**. The included [`vercel.json`](file:///d:/DocMind/vercel.json) ensures SPA routing works seamlessly for all routes and share links (`/share/:token`).

### Backend Deployment (Render / Railway / VPS)
1. In your cloud provider (e.g. [Render.com](https://render.com)), create a new **Web Service** connected to your repository.
2. Set the build parameters:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add your environment variables from `backend/.env` into the hosting dashboard.
4. Update `CORS_ORIGINS` with your production Vercel URL.

### Database Setup (Supabase)
DocMind automatically creates all required tables and enables **Row-Level Security (RLS)** upon first startup via `backend/app/core/database.py`.

---

## 📡 API & Streaming Reference

### Real-Time Chat Streaming
`GET /api/conversations/{conversation_id}/messages/stream`

Streams Server-Sent Events (SSE) directly to the client:
```http
GET /api/conversations/123/messages/stream?text=rate+his+resume&token=<JWT_TOKEN>&web_search=true HTTP/1.1
```

**SSE Event Types:**
- `event: title` $\to$ Returns auto-generated conversation title.
- `event: research` $\to$ Returns distilled research topic and sources count for the status bar.
- `event: citations` $\to$ Returns structured array of document and web source cards.
- `event: chunk` $\to$ Streams individual Markdown tokens.
- `event: related` $\to$ Returns array of 3–4 clickable follow-up questions.
- `event: error` $\to$ Broadcasts error details if generation encounters issues.

---

## 📄 License & Author

Developed by **[Siddhant Saxena](https://github.com/siddhantsaxena45)**  
Computer Science Undergraduate • AI & Full-Stack Developer  
- **GitHub:** [@siddhantsaxena45](https://github.com/siddhantsaxena45)  
- **LinkedIn:** [Siddhant Saxena](https://linkedin.com/in/siddhant-saxena)  
- **Project:** [DocMind AI](https://github.com/siddhantsaxena45/DocMind)

Licensed under the **MIT License**. Free for educational and open-source use.
