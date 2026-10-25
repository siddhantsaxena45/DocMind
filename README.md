<div align="center">

# 🧠 DocMind AI

### Next-Generation Document Intelligence & Perplexity-Grade AI Research Engine
**Google AI Overview & Perplexity Synthesis • Universal Multi-Doc Hyperlink Extraction • Multi-Engine Fast Search Cascade • Hybrid Vector & Lexical RAG (RRF) • 100% Free-Tier Architecture**

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
  <a href="https://doc-mind-eight.vercel.app" target="_blank"><strong>🚀 Live Demo</strong></a> •
  <a href="#-system-architecture--workflow-pipeline"><strong>🏗️ Architecture</strong></a> •
  <a href="#-core-capabilities--agentic-features"><strong>🌟 Features</strong></a> •
  <a href="#-quickstart--local-installation"><strong>⚡ Quickstart</strong></a> •
  <a href="#-api--server-sent-events-sse-reference"><strong>📡 API Reference</strong></a>
</p>

<p align="center">
  <strong>DocMind AI</strong> is an enterprise-grade document intelligence and real-time research engine inspired by <strong>Google AI Overviews</strong> and <strong>Perplexity AI</strong>. It seamlessly bridges <strong>Per-Chat Isolated Knowledge Bases</strong>, <strong>Universal Inline Hyperlink Parsing across all document formats</strong>, <strong>Multi-Engine Live Web Cascading</strong>, <strong>Anti-Throttling Cloud IP Fallbacks</strong>, <strong>Hybrid Vector & Lexical RAG (RRF)</strong>, <strong>Multimodal Vision OCR</strong>, and <strong>Automated Multi-Key API Rotation</strong>.
</p>

</div>

---

## 📑 Table of Contents

- [✨ Key Architectural Highlights](#-key-architectural-highlights)
- [🌟 Core Capabilities & Agentic Features](#-core-capabilities--agentic-features)
  - [1. Google AI Overview & Perplexity-Style Synthesis](#1-google-ai-overview--perplexity-style-synthesis)
  - [2. Multi-Engine Fast Search Cascade & Cloud Anti-Throttling](#2-multi-engine-fast-search-cascade--cloud-anti-throttling)
  - [3. Multi-Platform Live Search & Scraping (Kick, Twitch, GitHub, Reddit, YouTube, Wikipedia)](#3-multi-platform-live-search--scraping-kick-twitch-github-reddit-youtube-wikipedia)
  - [4. Universal Inline Hyperlink Parsing Across ALL Document Types](#4-universal-inline-hyperlink-parsing-across-all-document-types)
  - [5. Grounded Citations & Interactive Source Cards](#5-grounded-citations--interactive-source-cards)
  - [6. Hybrid Search Pipeline (Dense Vector + BM25 Lexical + Reciprocal Rank Fusion)](#6-hybrid-search-pipeline-dense-vector--bm25-lexical--reciprocal-rank-fusion)
  - [7. Interactive Chat Workflows (Edit Prompts, Try Again, Follow-ups, Public Sharing)](#7-interactive-chat-workflows-edit-prompts-try-again-follow-ups-public-sharing)
  - [8. Multi-Key API Key Rotation (100% Free-Tier Resilient)](#8-multi-key-api-key-rotation-100-free-tier-resilient)
  - [9. Per-Chat Isolated Knowledge Bases & Supabase RLS Shield](#9-per-chat-isolated-knowledge-bases--supabase-rls-shield)
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
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [📄 License & Author](#-license--author)

---

## ✨ Key Architectural Highlights

* **Perplexity & Google AI Overview Synthesis:** Generates high-density research answers with executive summaries, GFM comparison tables, bold benchmark highlights, interactive citation pills (`[1]`, `[2]`), and `**Key takeaway:**` boxes.
* **Multi-Engine Fast Web Cascade:** Eliminates cloud datacenter rate limits on Render/AWS/GCP by cascading across `ddgs` (configured with `backend="bing,brave,duckduckgo"` to bypass Mojeek timeouts), direct **Bing HTML search**, **Google News RSS**, and **DuckDuckGo Lite**.
* **Specialized Platform Integration:** Direct real-time metadata lookup and extraction for **Kick.com channels & live status**, **Twitch**, **GitHub repositories & stars**, **Reddit discussions**, **YouTube videos**, and **Wikipedia OpenSearch**.
* **Universal Document Hyperlink Extraction:** Traverses underlying PDF `/Annots` `/URI` dictionaries and Word OpenXML relationship trees (`document.xml.rels`) so embedded links inside resumes, reports, and spreadsheets are preserved during RAG chunking.
* **Framework & Technology Hygiene:** Distinguishes technical libraries (`Socket.io`, `Node.js`, `React.js`, `Express.js`, `BuiltSidCode.AI`) from candidate project links, preventing hallucinated "hyperlink formatting bug" criticisms.
* **Grounded Dual-Phase Citation Filtering:** Only sources *actually cited in the synthesized text* appear in the bottom `Cited Sources` carousel, while all evaluated candidates remain available in the `All Sources` modal.
* **Hybrid RAG with Reciprocal Rank Fusion (RRF $k=60$):** Fuses dense vector semantics (`text-embedding-004`) in Pinecone Serverless with sparse BM25 keyword search in Supabase PostgreSQL.
* **HyDE & Multi-Query Expansion:** Synthesizes hypothetical document embeddings and lexical reformulations to bridge user-to-document vocabulary mismatch, maximizing retrieval Context Precision without expensive rerankers.
* **In-Memory Semantic LRU Caching:** Hashes normalized queries and context fingerprints to serve instant sub-15ms cached responses, reducing LLM token consumption by ~40% and protecting free-tier rate quotas.
* **Continuous AI Evaluation CI/CD Gate:** Benchmarks Faithfulness ($\ge 85\%$) and Answer Relevance ($\ge 85\%$) on every Pull Request, publishing live Ragas scorecards directly to GitHub Actions Step Summaries.
* **100% Free-Tier Resilient:** Seamlessly rotates through up to 20 Google Gemini API keys with automated 429 self-healing, Pinecone free serverless tier, and Supabase free PostgreSQL.

---

## 🌟 Core Capabilities & Agentic Features

### 1. Google AI Overview & Perplexity-Style Synthesis
DocMind does not return superficial summaries or raw snippet cut-and-pastes. When web search is enabled, it generates high-density research answers modeled after Google AI Overviews and Perplexity:
* **Executive Summary:** Upfront comprehensive overview answering the core question in authoritative prose.
* **Cross-Source Fact Synthesis:** Synthesizes metrics, timestamps, and perspectives from distinct domains instead of reciting a single site.
* **Structured GFM Comparison Tables:** Formats specs, performance metrics, pricing, and entity comparisons into clean GitHub-Flavored Markdown (GFM) tables:
  ```markdown
  | Metric / Feature | Option A | Option B |
  | :--- | :--- | :--- |
  | Context Window | 1M tokens | 128k tokens |
  | Pricing (per 1M) | $0.15 | $3.00 |
  ```
* **Clean Multi-Line Cell Rendering:** Table cells with multi-line information are rendered as structured lines (bold title + secondary description) with zero literal `<br>` tags.
* **Data Point Highlighting:** Highlights dates, numbers, metrics, and percentages in bold (e.g. **38.8M subscribers**, **95.2% accuracy**, **$10M net worth**).
* **Interactive Numbered Citation Badges:** References sources directly with `[1]`, `[2]` badges that smoothly scroll and pulse-highlight the matching source card.
* **Key Takeaway Callout:** Concludes with an actionable `**Key takeaway:**` box.

---

### 2. Multi-Engine Fast Search Cascade & Cloud Anti-Throttling
When running on cloud hosting platforms (such as Render, AWS, or GCP), search engines frequently rate-limit or block datacenter IP addresses:
1. **Mojeek Timeout Prevention:** In modern `ddgs` versions, default fallback queries target Mojeek, which drops cloud connections and stalls for 4+ seconds. DocMind explicitly specifies `backend="bing,brave,duckduckgo"`, bypassing Mojeek entirely.
2. **2.5s Fail-Fast Timeout:** Searches fail over rapidly rather than hanging the user's streaming connection.
3. **Direct Bing HTML Search (`search_bing_html`):** Queries Bing web search directly with desktop browser headers, XPath, and regex extractors—completely immune to datacenter IP rate limits.
4. **Google News RSS Search (`search_google_news`):** Queries Google News RSS (`https://news.google.com/rss/search?q=...`), returning real-time verified articles, publisher attribution, and timestamps with zero IP blocks.
5. **DuckDuckGo Lite (`_fallback_lite_search`):** Server-rendered HTML fallback that avoids Cloudflare bot challenges.
6. **Multi-Query Circuit Breaker:** When Query 1 trips a rate limit, subsequent queries in the same multi-query batch immediately skip to Bing and Google News, saving 5–8 seconds of latency.

---

### 3. Multi-Platform Live Search & Scraping (Kick, Twitch, GitHub, Reddit, YouTube, Wikipedia)
Rather than relying solely on generic search snippets, DocMind directly interfaces with platforms:
* **Kick Channels (`search_kick`):** Direct API lookup at `https://kick.com/api/v2/channels/{slug}` with HTML fallback, extracting follower counts, live broadcast status, and bios.
* **Twitch:** Live creator discovery and streaming profiles.
* **GitHub Public Search API (`search_github`):** Queries `api.github.com/search/repositories`, returning repository full names, star counts, primary languages, and descriptions.
* **Reddit Discussions (`search_reddit`):** Queries `reddit.com/search.json`, extracting thread titles, target subreddits (`r/...`), and community discussion excerpts.
* **YouTube Results (`search_youtube`):** Directly queries YouTube search and parses verified channel handles and video metadata.
* **Wikipedia REST API (`search_wikipedia`):** Direct OpenSearch query at `en.wikipedia.org/w/api.php` for encyclopedic definitions.
* **Parallel Deep Scraper:** Uses `ThreadPoolExecutor` and `httpx` to live-scrape 4–5 candidate web articles across distinct root domains in parallel in **~1.2 seconds**.

---

### 4. Universal Inline Hyperlink Parsing Across ALL Document Types
Conventional RAG systems discard underlying link objects when converting documents to plaintext. DocMind extracts underlying link objects across every format:
* **PDFs & LaTeX / Overleaf (`.pdf`):** Inspects PDF annotation trees (`/Annots` $\to$ `/Subtype == /Link` $\to$ `/A` $\to$ `/URI`) and inlines them directly into the respective page text (`[Page 1 Embedded Links: ...]`).
* **Word Documents (`.docx`):** Traverses OpenXML relationship trees (`word/_rels/document.xml.rels`), mapping relationship IDs (`rIdX`) to target URLs and inlines `<w:hyperlink>` elements as `[Text](url)`.
* **PowerPoint Presentations (`.pptx`):** Inspects slide relationships (`slideN.xml.rels`) to preserve slide-level hyperlinks and plaintext URLs.
* **Excel Spreadsheets (`.xlsx`):** Inspects `cell.hyperlink.target` and inlines links next to cell values (`Value (https://...)`).
* **Plaintext & Markdown (`.txt`, `.md`, `.csv`):** Extracts Markdown syntax `[title](url)` and plaintext domain handles (GitHub, LinkedIn, LeetCode, Kaggle, Hugging Face).
* **Scanned Images & Receipts (`.png`, `.jpg`, `.webp`):** Uses Google Gemini Multimodal Vision OCR to extract text and links from image files.
* **Technology Framework Hygiene:** Guards technical terms (`Socket.io`, `Node.js`, `Express.js`, `React.js`, `BuiltSidCode.AI`) against false-positive URL matching.

---

### 5. Grounded Citations & Interactive Source Cards
To eliminate hallucinated or misleading source cards:
* **Dual-Phase Grounding ([`filter_and_ground_citations`](file:///d:/DocMind/backend/app/services/rag_service.py)):** After the LLM generates its response, DocMind cross-references the answer text against citation indices (`[1]`, `[2]`), explicit URLs, domain names, and titles.
* **Cited Sources vs. All Evaluated:** Only sources that directly contributed facts receive `used_in_answer = True` and appear in the `Cited Sources` carousel.
* **Interactive Source Pill Navigation:** Clicking `[1]` or `[2]` inside the text smoothly scrolls to the corresponding card in the carousel and adds an animated pulse ring.
* **Clutter-Free Text:** Strips clumsy internal reference tokens (`[[WEB_REF_1]]`) and document tags (`[Doc: ...]`, `([Doc: ...])`), keeping sentences clean and professional.
* **Anti-Spam Guard:** E-commerce marketplace links (AliExpress, Temu, Alibaba) and stock ticker aggregators (MarketWatch, SeekingAlpha) are strictly blocked from general research citations.
* **Rich Source Cards:** Cards display high-res domain favicons (via resilient Unavatar engine with automatic SVG and Lucide fallback), platform badges (`YouTube`, `Kick`, `GitHub`, `Wikipedia`, `r/subreddit`), 2-line title clamps, and a click-through URL.
* **All Sources Modal:** Users can click `All Evaluated Sources` to inspect every link considered during the research phase.

---

### 6. Hybrid Search Pipeline (Dense Vector + BM25 Lexical + Reciprocal Rank Fusion)
* **Dense Vector Search:** 768-dimensional semantic embeddings generated via Google `text-embedding-004` stored in Pinecone Serverless.
* **Sparse Lexical Search:** BM25 full-text search in Supabase PostgreSQL to guarantee exact keyword matches on acronyms, function names, and proper nouns.
* **Reciprocal Rank Fusion (RRF $k=60$):**
  $$RRF\_Score(d) = \sum_{m \in M} \frac{1}{60 + r_m(d)}$$
  Ensures that documents scoring high in either vector similarity or lexical precision appear at the top.

---

### 7. Interactive Chat Workflows (Edit Prompts, Try Again, Follow-ups, Public Sharing)
* **Edit Previous User Message:** Hover over any past prompt, edit the text, and submit to branch the conversation without losing context.
* **Try Again / Regenerate:** Regenerates the assistant's response with fresh retrieval or model variation with one click.
* **Interactive Follow-up Pills:** Dynamically generates 3–4 contextually relevant follow-up questions formatted with curved reply arrows (`↳ Elaborate`, `↳ Compare with...`) that submit on click.
* **Public Conversation Sharing:** Generate encrypted snapshot links (`/share/:token`) to share research outputs with non-authenticated users with instant revocation capability.

---

### 8. Multi-Key API Key Rotation (100% Free-Tier Resilient)
* **Thread-Safe Round-Robin:** Supports `GOOGLE_API_KEY1` through `GOOGLE_API_KEY20`. Every request shifts to the next key in the pool.
* **Automated 429 Recovery:** If a key encounters rate limits (`RESOURCE_EXHAUSTED` / `429`), DocMind catches the exception and immediately retries the next key in the pool with zero user-facing downtime.
* **Model Auto-Switching:** Automatically falls back across modern Gemini models (`gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3.6-flash`) if a specific model version is unavailable.

---

### 9. Per-Chat Isolated Knowledge Bases & Supabase RLS Shield
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
     ├─ Extracts text page-by-page (PyPDF, python-docx, openpyxl)
     ├─ Extracts PDF /Annots /URI hyperlinks
     ├─ Extracts Word rels (document.xml.rels)
     ├─ Normalizes font-switching whitespace
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
     [ Multi-Engine Fast Search & Platform Discovery ]
     ├─ Query intent planning (Kick, Twitch, GitHub, Reddit, YT, Web)
     ├─ DDGS search (backend="bing,brave,duckduckgo" — Mojeek bypassed)
     ├─ Direct Bing HTML Web Search fallback
     ├─ Google News RSS Search fallback
     ├─ DuckDuckGo Lite HTML fallback
     └─ Parallel ThreadPool scraper (articles, headings, tables)
                           │
                           ▼
     [ Google AI Search / Perplexity Synthesis (Gemini 3.8 Flash) ]
     ├─ 20-Key Round-Robin Rotator with 429 self-healing
     ├─ Executive Summary upfront
     ├─ Multi-source cross-synthesis with GFM comparison tables
     ├─ Clean multi-line table cells (no <br> tags)
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

## 🔍 Distributed Tracing & Observability (Langfuse)

DocMind incorporates enterprise-grade AI observability powered by **[Langfuse](https://langfuse.com)** (100% Free Cloud Tier: 50,000 traces/mo free):

- **Observations-First Data Model**: Built on Langfuse v4/v5 specifications, propagating `session_id` (conversation), `user_id`, tags (`["rag-chat", "docmind"]`), and request metadata across all nested spans.
- **Explicit Observation Typing**:
  - `retriever`: Vector similarity search (`vector_similarity_search`) and Reciprocal Rank Fusion (`hybrid_retrieval`, `assemble_rag_context`).
  - `tool`: Multi-engine web search queries (`web_search_multi`) and parallel web content scrapers (`fetch_multiple_urls`).
  - `generation`: Captured automatically via `langfuse.langchain.CallbackHandler`, recording exact model names, prompt & completion token counts, latency breakdowns (TTFT), and estimated USD cost.
- **Automated Quality & Guardrail Scores**:
  - `input_guardrails_passed` (1.0 = Clean, 0.0 = Prompt Injection / Leakage Blocked)
  - `output_guardrails_passed` (1.0 = Grounded Citations & Sanitized Formatting)
  - `benchmark_faithfulness` (Hallucination metric from Ragas evaluation suite)
  - `benchmark_answer_relevance` & `benchmark_context_precision`
- **Langfuse AI Agent Skill**: Installed in `.agents/skills/langfuse/SKILL.md` directly from [github.com/langfuse/skills](https://github.com/langfuse/skills), enabling agentic trace auditing, evaluation dataset creation, and prompt management.

### Configuration (`.env`)
```env
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://us.cloud.langfuse.com  # Or https://cloud.langfuse.com (EU)
LANGFUSE_TRACING_ENVIRONMENT=development
```

---

## 💻 Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + Vite 7** | Fast Single Page Application with optimized bundle splitting |
| **Styling & Design** | **Tailwind CSS v4 + Vanilla CSS** | Curated dark mode, glassmorphism, responsive drawers & carousels |
| **Icons & Typography** | **Lucide React + Outfit/Inter** | Modern UI iconography and clean typography |
| **Streaming Protocol** | **Server-Sent Events (`EventSource`)** | Ultra-low latency token streaming with dedicated event channels |
| **Backend Framework** | **FastAPI (Python 3.11+)** | High-performance asynchronous REST & SSE streaming server |
| **AI Models** | **Google Gemini 3.8 Flash** | Fast reasoning, multimodal vision OCR, and search query planning |
| **Fast Auxiliary Model** | **Google Gemini 3.5 Flash-Lite** | Low-latency follow-up questions, topic distillation, title generation |
| **Embeddings** | **Google text-embedding-004** | 768-dimensional semantic embeddings |
| **Vector Database** | **Pinecone Serverless** | Cosine metric similarity search with user-isolated namespaces |
| **Primary Database** | **Supabase (PostgreSQL 15)** | Relational storage with strict Row-Level Security (RLS) |
| **Document Parsers** | **PyPDF, python-docx, openpyxl** | Parsing PDF annotations, Word XML rels, and Excel cells |
| **Web Search Cascade** | **`ddgs`, Bing HTML, Google News RSS, DDG Lite** | Multi-engine search cascade eliminating cloud datacenter timeouts |
| **Platform APIs** | **Kick, Twitch, GitHub, Reddit, YouTube, Wikipedia** | Real-time social profile, repository, and community data |
| **Parallel Scraper** | **ThreadPoolExecutor + httpx + lxml** | Scrapes articles, headings, and data tables across distinct domains |
| **AI Observability & Tracing** | **Langfuse (Free Cloud / Self-Hosted)** | Distributed tracing, token tracking, latency breakdown, guardrail scores, and Ragas evals |
| **Favicon Engine** | **Unavatar CDN & SVG Fallback** | Dynamic high-res website favicons with deterministic SVG fallbacks for 100% 200 OK reliability |
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
│   │   │   └── web_search_service.py# Multi-engine search cascade & platform scrapers
│   │   └── main.py                  # FastAPI application entrypoint & CORS middleware
│   ├── requirements.txt             # Python dependencies
│   ├── run.py                       # Local uvicorn development launcher
│   └── tests/
│       ├── test_full_rag_pipeline.py# End-to-end RAG, auth, document parsing tests
│       └── test_rag_chatbot.py      # Chatbot flow and retrieval tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginView.jsx        # Authentication modal with tabbed signup/login
│   │   │   ├── ShareModal.jsx       # Public conversation link sharing modal
│   │   │   ├── SharedChatView.jsx   # Read-only public shared chat viewer
│   │   │   ├── Sidebar.jsx          # Conversation drawer, search bar, new chat button
│   │   │   └── UploadModal.jsx      # Multi-file drag-and-drop document uploader
│   │   ├── features/Chat/
│   │   │   ├── AllSourcesModal.jsx  # Detailed drawer of all evaluated web/doc links
│   │   │   ├── ChatView.jsx         # Main chat interface, action bar & SSE receiver
│   │   │   ├── FollowupQuestions.jsx# Contextual interactive follow-up question pills
│   │   │   ├── MarkdownTableRenderer.jsx # GFM tables, multi-line cells, citation badges
│   │   │   ├── ResearchStatusBar.jsx# Collapsible research bar with stacked favicons
│   │   │   └── SourceCardsCarousel.jsx # Perplexity-style horizontal source cards
│   │   ├── services/
│   │   │   ├── api.js               # Centralized Axios client & document management
│   │   │   └── auth.js              # Token persistence and authentication helpers
│   │   ├── App.jsx                  # Root layout, navigation, and authenticated routing
│   │   ├── index.css                # Tailwind CSS v4 design tokens and glassmorphism
│   │   └── main.jsx                 # React DOM mount entrypoint
│   ├── package.json                 # Frontend dependencies (React 19, Tailwind v4, Vite 7)
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

# Google Gemini API Keys (Supports up to 20 keys for automated round-robin rotation)
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

### Core REST Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Registers a new user account |
| `POST` | `/api/auth/login` | Authenticates credentials and issues JWT token |
| `GET` | `/api/auth/me` | Fetches current user profile |
| `POST` | `/api/documents/upload` | Uploads documents, extracts hyperlinks, indexes in Pinecone + Postgres |
| `GET` | `/api/documents` | Lists all documents belonging to the authenticated user |
| `DELETE` | `/api/documents/{id}` | Deletes document chunks from vector index and relational database |
| `POST` | `/api/conversations` | Creates a new conversation thread |
| `GET` | `/api/conversations` | Fetches all conversations for the user |
| `GET` | `/api/conversations/{id}/messages` | Retrieves message history for a conversation |
| `POST` | `/api/share/{id}` | Generates a public snapshot share link (`/share/:token`) |
| `GET` | `/api/share/token/{token}` | Fetches read-only public conversation snapshot |
| `DELETE` | `/api/share/{id}` | Revokes a public share link |
| `GET` | `/health` | Healthcheck verification endpoint |

---

## 🧪 Testing & Quality Assurance

DocMind includes a test suite covering the full RAG pipeline, authentication, document chunking, and multi-format parsing:

```bash
cd backend
pytest -v
```

**Test Coverage Highlights:**
- **`test_document_parser_multi_format`**: Validates text extraction and recursive chunking across documents.
- **`test_web_search_service`**: Verifies multi-engine web search queries, link formatting, and metadata extraction.
- **`test_end_to_end_rag_and_sharing_workflow`**: Tests complete end-to-end user registration, file upload, chat synthesis, and public sharing.

---

## 📄 License & Author

Developed by **[Siddhant Saxena](https://github.com/siddhantsaxena45)**  
Computer Science Undergraduate • AI & Full-Stack Developer  
- **GitHub:** [@siddhantsaxena45](https://github.com/siddhantsaxena45)  
- **LinkedIn:** [Siddhant Saxena](https://linkedin.com/in/siddhant-saxena)  
- **Repository:** [DocMind AI](https://github.com/siddhantsaxena45/DocMind)

Licensed under the **MIT License**. Free for educational, academic, and open-source use.
