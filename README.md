<div align="center">

# 🧠 DocMind AI

### State-of-the-Art Document Intelligence & Real-Time AI Search Engine
**Google AI Overview & Perplexity-Grade Synthesis • Universal Multi-Doc Hyperlink Parsing • Multi-Domain Parallel Live Scraping • Hybrid Vector & Lexical RAG (RRF) • 100% Free-Tier Architecture**

<p align="center">
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite_7-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python_3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/Supabase_PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Pinecone_Serverless-000000?style=for-the-badge&logo=pinecone&logoColor=white" alt="Pinecone" />
  <img src="https://img.shields.io/badge/Google_Gemini_3.8_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p align="center">
  <strong>DocMind AI</strong> is an enterprise-grade document intelligence and real-time research engine inspired by <strong>Google AI Overviews</strong> and <strong>Perplexity AI</strong>. It unifies <strong>Per-Chat Isolated Knowledge Bases</strong>, <strong>Universal Inline Hyperlink Parsing across all document formats</strong>, <strong>Multi-Domain Deep Parallel Web Scraping</strong>, <strong>Context-Aware Fact Verification</strong>, <strong>Hybrid Vector & Lexical RAG (RRF)</strong>, <strong>Multimodal Vision OCR</strong>, and <strong>Automated Multi-Key API Rotation</strong>.
</p>

</div>

---

## 📑 Table of Contents

- [✨ Key Architectural Highlights](#-key-architectural-highlights)
- [🌟 Core Capabilities & Agentic Features](#-core-capabilities--agentic-features)
  - [1. Google AI Overview & Perplexity-Style Synthesis](#1-google-ai-overview--perplexity-style-synthesis)
  - [2. Universal Inline Hyperlink Parsing Across ALL Document Types](#2-universal-inline-hyperlink-parsing-across-all-document-types)
  - [3. Deep Multi-Domain Parallel Web Scraping](#3-deep-multi-domain-parallel-web-scraping)
  - [4. Grounded Citation Verification & Source Cards](#4-grounded-citation-verification--source-cards)
  - [5. Context-Aware Verification Search & Entity Planning](#5-context-aware-verification-search--entity-planning)
  - [6. Hybrid Search Pipeline (Vector + BM25 + Reciprocal Rank Fusion)](#6-hybrid-search-pipeline-vector--bm25--reciprocal-rank-fusion)
  - [7. Interactive Chat Workflow (Edit Messages, Try Again, Follow-ups)](#7-interactive-chat-workflow-edit-messages-try-again-follow-ups)
  - [8. Multi-Key API Key Rotation (100% Free Tier Resilient)](#8-multi-key-api-key-rotation-100-free-tier-resilient)
  - [9. Per-Chat Isolated Knowledge Bases & RLS Shield](#9-per-chat-isolated-knowledge-bases--rls-shield)
- [🏗️ System Architecture & Workflow Pipeline](#️-system-architecture--workflow-pipeline)
- [💻 Technology Stack](#-technology-stack)
- [📁 Project Directory Structure](#-project-directory-structure)
- [🚀 Quickstart & Local Installation](#-quickstart--local-installation)
  - [Prerequisites](#prerequisites)
  - [1. Environment Configuration](#1-environment-configuration)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [🌐 Deployment Guide](#-deployment-guide)
  - [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
  - [Backend Deployment (Render / Railway / VPS)](#backend-deployment-render--railway--vps)
  - [Database Setup (Supabase PostgreSQL)](#database-setup-supabase-postgresql)
- [📡 API & Server-Sent Events (SSE) Reference](#-api--server-sent-events-sse-reference)
- [📄 License & Author](#-license--author)

---

## ✨ Key Architectural Highlights

* **Google AI Search & Perplexity-Grade Engine:** Multi-source facts synthesized into clean executive summaries, comparison tables, bold benchmarks, inline citation badges (`[1]`, `[2]`), and `**Key takeaway:**` callouts.
* **Universal Document Hyperlink Extraction:** Parses underlying XML relationship trees and PDF annotation objects (`/Annots` $\to$ `/URI`) so links inside PDFs, Word docs, PowerPoint decks, and Excel sheets are never lost during RAG chunking.
* **Parallel Multi-Domain Scraping:** Scrapes up to 5 diverse authoritative domains (Wikipedia REST API, news, tech documentation, blogs, official portals) in parallel via `ThreadPoolExecutor` within **~1.2 seconds**.
* **Grounded Source Filtering:** Dual-phase evaluation verifies which sources were *actually cited* in the generated answer. Only grounded sources appear in the `Cited Sources` carousel, while all evaluated links remain inspectable in the `All Sources` modal.
* **Hybrid RAG with Reciprocal Rank Fusion (RRF $k=60$):** Combines dense vector semantics (`text-embedding-004`) in Pinecone Serverless with sparse BM25 lexical keyword retrieval in PostgreSQL.
* **100% Free-Tier Resilient:** Seamlessly rotates through up to 20 Google Gemini API keys with automated 429 recovery, DuckDuckGo free search, Pinecone free serverless tier, and Supabase free PostgreSQL.

---

## 🌟 Core Capabilities & Agentic Features

### 1. Google AI Overview & Perplexity-Style Synthesis
DocMind does not return vague summaries or raw snippet aggregations. When web search is enabled, it generates high-density research answers modeled after Google AI Overviews and Perplexity:
* **Executive Summary:** Upfront comprehensive overview answering the core question in authoritative prose.
* **Cross-Source Fact Synthesis:** Merges facts, benchmarks, and perspectives from distinct domains instead of reciting a single site.
* **Structured Markdown Tables:** Formats specs, performance metrics, pricing, and entity comparisons into clean GitHub-Flavored Markdown (GFM) tables:
  ```markdown
  | Model / Option | Context Window | Benchmark (MMLU) | Pricing (per 1M) |
  | :--- | :--- | :--- | :--- |
  | Option A | 1M tokens | 88.5% | $0.15 |
  | Option B | 128k tokens | 87.2% | $3.00 |
  ```
* **Data Point Highlighting:** Highlights dates, numbers, metrics, and percentages in bold (e.g. **38.8M subscribers**, **95.2% accuracy**, **$10M net worth**).
* **Numbered Citation Badges:** References sources directly with `[1]`, `[2]` or markdown links `[Source Title](URL)`.
* **Key Takeaway Callout:** Concludes with an actionable `**Key takeaway:**` box.

---

### 2. Universal Inline Hyperlink Parsing Across ALL Document Types
In conventional RAG systems, embedded document hyperlinks disappear during plain-text extraction. DocMind extracts underlying link objects across every format:
* **PDFs & LaTeX / Overleaf (`.pdf`):** Inspects PDF annotation trees (`/Annots` $\to$ `/Subtype == /Link` $\to$ `/A` $\to$ `/URI`) and inlines them directly into the respective page text (`[Page 1 Embedded Links: ...]`).
* **Word Documents (`.docx`):** Traverses OpenXML relationship trees (`word/_rels/document.xml.rels`), mapping relationship IDs (`rIdX`) to target URLs and inlines `<w:hyperlink>` elements as `[Text](url)`.
* **PowerPoint Presentations (`.pptx`):** Inspects slide relationships (`slideN.xml.rels`) to preserve slide-level hyperlinks and plaintext URLs.
* **Excel Spreadsheets (`.xlsx`):** Inspects `cell.hyperlink.target` and inlines links next to cell values (`Value (https://...)`).
* **Plaintext & Markdown (`.txt`, `.md`, `.csv`):** Extracts Markdown syntax `[title](url)` and plaintext domain handles (GitHub, LinkedIn, LeetCode, Kaggle, Hugging Face).
* **Scanned Images & Receipts (`.png`, `.jpg`, `.webp`):** Uses Google Gemini Multimodal Vision OCR to extract text and links from image files.

---

### 3. Deep Multi-Domain Parallel Web Scraping
Rather than displaying superficial 1-line search snippets:
1. **Multi-Angle Query Generation:** Formulates 2–3 targeted, temporally-aware queries for the current year.
2. **Diverse Domain Selection:** Selects top search candidates across **distinct root domains** (e.g., 1 Wikipedia article, 1 official documentation page, 1 news report, 1 technical blog) to avoid duplicate domain bias.
3. **Wikipedia REST API:** Direct lookup at `en.wikipedia.org/api/rest_v1/page/summary/{slug}` providing instant encyclopedic facts.
4. **Universal HTML Article Scraper:** Extracts semantic containers (`<article>`, `<main>`), headings (`h1`–`h3`), content paragraphs (`<p>`, `<li>`), and data tables (`<table>`), while dropping navigation bars, headers, footers, and advertisements.
5. **Parallel Scraping:** Employs `ThreadPoolExecutor` with concurrent `httpx` workers to live-scrape 4–5 distinct websites in parallel in **~1.2 seconds**.

---

### 4. Grounded Citation Verification & Source Cards
To eliminate hallucinated or misleading source cards:
* **Dual-Phase Grounding ([`filter_and_ground_citations`](file:///d:/DocMind/backend/app/services/rag_service.py)):** After the LLM generates its response, DocMind cross-references the answer text against citation indices (`[1]`, `[2]`), explicit URLs, domain names, and titles.
* **Cited Sources vs. All Evaluated:** Only sources that directly contributed facts receive `used_in_answer = True` and appear in the `Cited Sources` carousel.
* **Anti-Spam Guard:** E-commerce marketplace links (AliExpress, Temu, Alibaba) are strictly blocked from general research citations.
* **Rich Source Cards:** Cards display Google S2 64px domain favicons, platform badges (`YouTube`, `Wikipedia`, `GitHub`, `r/subreddit`), 2-line title clamps, and a click-through URL.
* **All Sources Modal:** Users can click `All Evaluated Sources` to inspect every link considered during the research phase.

---

### 5. Context-Aware Verification Search & Entity Planning
When asked to *"verify his claims on internet"*, *"fact-check this resume on google"*, or *"audit this project"*:
* **No Generic Searches:** Traditional bots search the literal query *"verify his claims on internet"* and get irrelevant HR tips.
* **Entity Extraction:** DocMind extracts proper nouns, company names, GitHub handles, project titles, and URLs from the document context.
* **Automated Investigation Plan:** Executes multi-query DuckDuckGo searches (e.g. `'Siddhant Saxena' 'Jaypee Institute'`, `'siddhantsaxena45' github`) and live-scrapes the candidate's GitHub repositories and live websites to verify matching claims.

---

### 6. Hybrid Search Pipeline (Vector + BM25 + Reciprocal Rank Fusion)
* **Dense Vector Search:** 768-dimensional semantic embeddings generated via Google `text-embedding-004` stored in Pinecone Serverless.
* **Sparse Lexical Search:** BM25 full-text search in Supabase PostgreSQL to guarantee exact keyword matches on acronyms, function names, and proper nouns.
* **Reciprocal Rank Fusion (RRF $k=60$):**
  $$RRF\_Score(d) = \sum_{m \in M} \frac{1}{60 + r_m(d)}$$
  Ensures that documents scoring high in either vector similarity or lexical precision appear at the top.

---

### 7. Interactive Chat Workflow (Edit Messages, Try Again, Follow-ups)
* **Edit Previous User Message:** Hover over any past prompt, edit the text, and submit to branch the conversation without losing context.
* **Try Again / Regenerate:** Regenerates the assistant's response with fresh retrieval or model variation with one click.
* **Interactive Follow-up Pills:** Dynamically generates 3–4 contextually relevant follow-up questions formatted with curved reply arrows (`↳ Elaborate`, `↳ Compare with...`) that submit on click.
* **Public Conversation Sharing:** Generate encrypted snapshot links (`/share/:token`) to share research outputs with non-authenticated users.

---

### 8. Multi-Key API Key Rotation (100% Free Tier Resilient)
* **Thread-Safe Round-Robin:** Supports `GOOGLE_API_KEY1` through `GOOGLE_API_KEY20`. Every request shifts to the next key in the pool.
* **Automated 429 Recovery:** If a key encounters rate limits (`RESOURCE_EXHAUSTED` / `429`), DocMind catches the exception and immediately retries the next key in the pool with zero user-facing downtime.
* **Model Auto-Switching:** Automatically falls back across modern Gemini models (`gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3.6-flash`) if a specific model version is unavailable.

---

### 9. Per-Chat Isolated Knowledge Bases & RLS Shield
* **Zero Cross-Chat Bleed:** Files uploaded to Chat A belong exclusively to Chat A. Chat B cannot see, retrieve, or cite them.
* **Interactive Attachment Chips:** Real-time scoped file chips allow attaching or removing (`✕`) documents on the fly.
* **Supabase Row-Level Security (RLS):** All database tables (`users`, `documents`, `conversations`, `messages`, `shared_conversations`) are shielded with strict RLS policies.
* **Stateless JWT Security:** Passwords hashed via PBKDF2/bcrypt; API requests authenticated via short-lived JWTs (`HS256`).

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

[ User Asks Question / Toggles Real-Time Web Search ON ]
                           │
                           ▼
          [ Hybrid Search Engine (RRF k=60) ]
     ├─ Dense Vector Retrieval (Pinecone)
     ├─ Lexical Keyword Retrieval (PostgreSQL)
     └─ Reciprocal Rank Fusion Merging
                           │
                           ▼
     [ Multi-Domain Parallel Web Research Engine ]
     ├─ Multi-angle query formulation (current year aware)
     ├─ DuckDuckGo search across multiple queries
     ├─ Selects candidate URLs across DISTINCT domains
     ├─ Wikipedia REST API structured lookup
     └─ Parallel ThreadPool scraper (articles, headings, tables)
                           │
                           ▼
     [ Google AI Search / Perplexity Synthesis (Gemini 3.8 Flash) ]
     ├─ 20-Key Round-Robin Rotator with 429 self-healing
     ├─ Executive Summary upfront
     ├─ Multi-source cross-synthesis with GFM comparison tables
     ├─ Numbered citation badges [1], [2] matching sources
     └─ Key takeaway callout
                           │
                           ▼
    [ Citation Grounding (filter_and_ground_citations) ]
     ├─ Identifies sources actually cited in generated text
     └─ Marks used_in_answer = True for cited cards only
                           │
                           ▼
    [ Server-Sent Events (SSE) Streaming to React UI ]
     ├─ event: research  (Distilled topic & stacked favicon pill)
     ├─ event: citations (Perplexity source cards)
     ├─ event: chunk     (Real-time token stream)
     ├─ event: citations (Updated grounded citations)
     └─ event: related   (Follow-up suggestion pills)
```

---

## 💻 Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + Vite** | Fast Single Page Application with optimized bundle splitting |
| **Styling & Design** | **Tailwind CSS + Vanilla CSS** | Curated dark mode, glassmorphism, responsive drawers & carousels |
| **Icons & Typography** | **Lucide React + Outfit/Inter** | Modern UI iconography and clean typography |
| **Streaming Protocol** | **Server-Sent Events (`EventSource`)** | Ultra-low latency token streaming with dedicated event channels |
| **Backend Framework** | **FastAPI (Python 3.11+)** | High-performance asynchronous REST & SSE streaming server |
| **AI Models** | **Google Gemini 3.8 Flash** | Fast reasoning, multimodal vision OCR, and search query planning |
| **Embeddings** | **Google text-embedding-004** | 768-dimensional semantic embeddings |
| **Vector Database** | **Pinecone Serverless** | Cosine metric similarity search with user-isolated namespaces |
| **Primary Database** | **Supabase (PostgreSQL 15)** | Relational storage with strict Row-Level Security (RLS) |
| **Document Parsers** | **PyPDF, python-docx, openpyxl** | Parsing PDF annotations, Word XML rels, and Excel cells |
| **Web Search** | **DuckDuckGo API (`ddgs`) + httpx** | 100% free search engine with HTML fallback and redirect decoder |
| **Parallel Scraper** | **ThreadPoolExecutor + httpx + lxml** | Scrapes articles, headings, and data tables across distinct domains |
| **Favicon Engine** | **Google S2 Favicon CDN** | Dynamic 64px website favicons for all verified domains |
| **Auth & Security** | **JWT (python-jose) + Passlib** | Stateless token auth with PBKDF2 password hashing |

---

## 📁 Project Directory Structure

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
│   │   │   ├── config.py            # Pydantic settings & APIKeyRotator (up to 20 keys)
│   │   │   └── database.py          # PostgreSQL connection & RLS migration
│   │   ├── services/
│   │   │   ├── document_service.py  # Universal link parser (PDF, DOCX, PPTX, XLSX, OCR)
│   │   │   ├── llm_service.py       # Gemini 3.8 Flash, query planning, followup questions
│   │   │   ├── rag_service.py       # Hybrid retrieval (RRF) & citation grounding
│   │   │   ├── vector_service.py    # Pinecone vector index manager
│   │   │   └── web_search_service.py# DuckDuckGo search & parallel multi-domain scraper
│   │   └── main.py                  # FastAPI application entrypoint & CORS middleware
│   ├── requirements.txt             # Python dependencies
│   └── run.py                       # Local uvicorn development launcher
├── frontend/
│   ├── src/
│   │   ├── components/              # Sidebar, LoginView, ShareModal, SharedChatView
│   │   ├── features/Chat/
│   │   │   ├── ChatView.jsx         # Main chat interface with action bar & SSE receiver
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

## 🚀 Quickstart & Local Installation

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

# Database (Supabase PostgreSQL Connection String)
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
The FastAPI backend will start on **`http://localhost:8000`** with interactive Swagger documentation at `http://localhost:8000/docs`.

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
3. Configure build settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variable in Vercel:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://docmind-backend.onrender.com`).
5. Click **Deploy**. The included [`vercel.json`](file:///d:/DocMind/vercel.json) automatically handles SPA client-side routing for `/share/:token`.

### Backend Deployment (Render / Railway / VPS)
1. In [Render.com](https://render.com), create a new **Web Service** connected to your repository.
2. Configure settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add all environment variables from `backend/.env` into the Render Environment dashboard.
4. Update `CORS_ORIGINS` to include your production Vercel domain.

### Database Setup (Supabase PostgreSQL)
DocMind automatically initializes all required tables and enables **Row-Level Security (RLS)** upon first boot via `backend/app/core/database.py`. No manual SQL migrations required.

---

## 📡 API & Server-Sent Events (SSE) Reference

### Real-Time Chat Streaming
`GET /api/conversations/{conversation_id}/messages/stream`

Streams Server-Sent Events (SSE) directly to the client:
```http
GET /api/conversations/123/messages/stream?text=rate+his+resume&token=<JWT_TOKEN>&web_search=true HTTP/1.1
```

**SSE Event Channels:**
| Event | Payload | Purpose |
| :--- | :--- | :--- |
| `event: title` | `{"title": "..."}` | Automatically updates conversation title based on user intent |
| `event: research` | `{"query": "...", "status": "...", "sources_count": 5}` | Updates the collapsible research status bar with query and count |
| `event: citations` | `[{"title": "...", "url": "...", "site_name": "...", "favicon": "..."}]` | Sends initial evaluated sources and updates with grounded citations |
| `event: chunk` | `{"chunk": "..."}` | Real-time incremental token stream |
| `event: related` | `["Question 1", "Question 2", "Question 3"]` | Context-aware interactive follow-up question pills |
| `event: done` | `{"message_id": "..."}` | Signals completion of message generation |
| `event: error` | `{"error": "..."}` | Broadcasts actionable error details if an exception occurs |

---

## 📄 License & Author

Developed by **[Siddhant Saxena](https://github.com/siddhantsaxena45)**  
Computer Science Undergraduate • AI & Full-Stack Developer  
- **GitHub:** [@siddhantsaxena45](https://github.com/siddhantsaxena45)  
- **LinkedIn:** [Siddhant Saxena](https://linkedin.com/in/siddhant-saxena)  
- **Repository:** [DocMind AI](https://github.com/siddhantsaxena45/DocMind)

Licensed under the **MIT License**. Free for educational, academic, and open-source use.
