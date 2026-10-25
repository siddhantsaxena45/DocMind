<div align="center">

# 🧠 DocMind AI

### Production-Grade Document Intelligence & Perplexity-Style Research Engine
**Hybrid RAG (RRF $k=60$) • HyDE & Multi-Query Expansion • In-Memory Semantic Caching • Langfuse Distributed Tracing • Ragas Automated Evals • Layered AI Guardrails • 100% Free-Tier Architecture**

<p align="center">
  <a href="https://github.com/siddhantsaxena45/DocMind/actions/workflows/ci.yml">
    <img src="https://github.com/siddhantsaxena45/DocMind/actions/workflows/ci.yml/badge.svg" alt="CI/CD Pipeline" />
  </a>
  <img src="https://img.shields.io/badge/Ragas_Faithfulness-87.1%25-brightgreen?style=flat&logo=ragas" alt="Faithfulness 87.1%" />
  <img src="https://img.shields.io/badge/Answer_Relevance-90.5%25-blue?style=flat" alt="Relevance 90.5%" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License MIT" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite_7-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python_3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/Langfuse_v5-000000?style=for-the-badge&logo=opentelemetry&logoColor=white" alt="Langfuse" />
  <img src="https://img.shields.io/badge/Pinecone_Serverless-000000?style=for-the-badge&logo=pinecone&logoColor=white" alt="Pinecone" />
  <img src="https://img.shields.io/badge/Supabase_PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker_Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

<p align="center">
  <a href="https://doc-mind-eight.vercel.app" target="_blank"><strong>🚀 Live Demo on Vercel</strong></a> •
  <a href="#-automated-rag-evaluation-scorecard-ragas-methodology"><strong>📊 AI Evals</strong></a> •
  <a href="#-system-architecture--pipeline-flow"><strong>🏗️ Architecture</strong></a> •
  <a href="#-core-enterprise-capabilities"><strong>🌟 Features</strong></a> •
  <a href="#-quickstart--local-setup"><strong>⚡ Quickstart</strong></a> •
  <a href="#-api-reference"><strong>📡 API Docs</strong></a>
</p>

<p align="center">
  <strong>DocMind AI</strong> is an enterprise-grade document intelligence and real-time research engine modeled after <strong>Google AI Overviews</strong> and <strong>Perplexity AI</strong>. Built to solve the real-world shortcomings of naive tutorial RAG systems, it integrates <strong>Hybrid Vector & Lexical Reciprocal Rank Fusion</strong>, <strong>HyDE & Multi-Query Expansion</strong>, <strong>In-Memory LRU Semantic Caching</strong>, <strong>Distributed OpenTelemetry Tracing via Langfuse</strong>, <strong>SSRF Pre-Resolution Security</strong>, and <strong>Automated Ragas Triad Evaluation Benchmarking</strong>.
</p>

</div>

---

## 📊 Automated RAG Evaluation Scorecard (Ragas Methodology)

DocMind includes an automated evaluation benchmark suite ([`backend/tests/evals_ragas.py`](backend/tests/evals_ragas.py)) running against synthetic multi-domain technical, scientific, and document engineering test cases. Every commit and pull request is gated against these quantitative thresholds in CI/CD:

| Evaluation Metric | Target Benchmark | Measured DocMind Score | Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Faithfulness (Hallucination Control)** | $\ge 0.85$ | **0.871** (87.1%) | 🟢 **PASSED** | Verifies factual claims in the answer are strictly grounded in retrieved evidence. |
| **Answer Relevance** | $\ge 0.85$ | **0.905** (90.5%) | 🟢 **PASSED** | Measures how directly and concisely the synthesized answer addresses the user prompt. |
| **Context Precision** | $\ge 0.85$ | **0.908** (90.8%) | 🟢 **PASSED** | Quantifies whether top-ranked retrieved context chunks contain essential ground truth entities. |

### Domain Benchmark Breakdown
```markdown
- [eval_01] Physics / Quantum:        Faithfulness=86.7% | Relevance=86.7% | Precision=88.9%
- [eval_02] Information Retrieval:    Faithfulness=93.8% | Relevance=91.4% | Precision=83.3%
- [eval_03] RAG Architecture:        Faithfulness=80.0% | Relevance=91.4% | Precision=92.9%
- [eval_04] Document Engineering:    Faithfulness=100.0%| Relevance=89.1% | Precision=100.0%
- [eval_05] Security:                Faithfulness=75.0% | Relevance=94.0% | Precision=88.9%
```

> **CI/CD Quality Gate:** Evaluation benchmarks are automatically executed via GitHub Actions and published directly to **GitHub Job Summaries** and **Langfuse Cloud** on every Pull Request.

---

## ✨ Key Architectural Highlights

* **Hybrid RAG with Reciprocal Rank Fusion (RRF $k=60$):** Fuses dense vector semantics (`text-embedding-004` with Matryoshka dimension truncation in Pinecone) and sparse BM25 keyword matching in Supabase PostgreSQL, eliminating score calibration skew.
* **HyDE & Multi-Query Expansion:** Synthesizes hypothetical document embeddings and lexical reformulations to bridge vocabulary mismatch between user phrasing and dense technical document syntax.
* **In-Memory Semantic LRU Caching:** Hashes normalized queries and context fingerprints into an in-memory LRU cache (`max_size=256`, 1-hour TTL), serving repeat queries in **< 15ms** and cutting free-tier Gemini token usage by ~40%.
* **Full Langfuse Distributed Observability:** Complete observation hierarchy (`as_type="retriever"` for vector search, `as_type="tool"` for scrapers, `CallbackHandler` for LLM generations) tracking token counts, latency breakdowns (TTFT), and cost per query.
* **Defense-in-Depth AI Guardrails:** Pre-inference regex and heuristic prompt injection detection, SSRF pre-resolution DNS blocking (blocking loopback, private RFC1918 subnets, and AWS/GCP cloud metadata `169.254.169.254`), and strict tenant database isolation.
* **Multi-Engine Fast Web Cascade:** Bypasses cloud datacenter IP blocks on Render/AWS by cascading across `ddgs` (excluding Mojeek), direct **Bing HTML search**, **Google News RSS**, and **DuckDuckGo Lite**.
* **Universal Multi-Format Ingestion:** Traverses underlying PDF `/Annots` `/URI` dictionaries, DOCX relationship XML (`document.xml.rels`), PPTX slide relations, and XLSX cell links, preserving active URLs and structure across all documents.
* **100% Free-Tier Resilient:** Seamlessly rotates through an automated pool of 9 Google Gemini keys with automatic 429 self-healing, Pinecone Serverless, Supabase free Postgres, and Langfuse Cloud.

---

## 🏗️ System Architecture & Pipeline Flow

```
                      ┌────────────────────────────────────────┐
                      │            User Client (React)         │
                      └───────────────────┬────────────────────┘
                                          │ HTTP / SSE Stream
                                          ▼
                      ┌────────────────────────────────────────┐
                      │          FastAPI Gateway Server        │
                      └───────────────────┬────────────────────┘
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        │                                 │                                 │
        ▼                                 ▼                                 ▼
┌───────────────────┐           ┌───────────────────┐           ┌───────────────────┐
│ Input Guardrails  │           │   Semantic Cache  │           │   Multi-Key Pool  │
│ - Injection Check │           │ - LRU Eviction    │           │ - 9 Gemini Keys   │
│ - SSRF DNS Filter │           │ - Sub-15ms Return │           │ - 429 Auto-Heal   │
└─────────┬─────────┘           └─────────┬─────────┘           └─────────┬─────────┘
          │                               │ (Cache Miss)                  │
          ▼                               ▼                               ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           Hybrid Retrieval Engine                                 │
│                                                                                   │
│   ┌───────────────────────────┐                   ┌───────────────────────────┐   │
│   │   Pinecone Serverless     │                   │    Supabase PostgreSQL    │   │
│   │   Dense Vector Search     │                   │    Sparse BM25 Keyword    │   │
│   └─────────────┬─────────────┘                   └─────────────┬─────────────┘   │
│                 │                                               │                 │
│                 └───────────────────────┬───────────────────────┘                 │
│                                         ▼                                         │
│                      Reciprocal Rank Fusion (RRF k=60)                            │
│                                         │                                         │
│                 ┌───────────────────────┴───────────────────────┐                 │
│                 ▼                                               ▼                 │
│       HyDE Query Expansion                            Live Web Verification       │
│       (Synthetic Passage)                             (Multi-Engine Scraper)      │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           Langfuse Distributed Tracing                            │
│  - Observation Spans: [Retriever] ──▶ [Tool] ──▶ [Generation]                     │
│  - Token Counts, Latency Profiling (TTFT), Session & User Propagation             │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                     Perplexity & Google AI Overview Synthesis                     │
│  - Executive Summary, GFM Comparison Tables, Grounded Citation Pills [1] [2]      │
│  - Real-Time Token Streaming via Server-Sent Events (SSE)                         │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Core Enterprise Capabilities

### 1. Perplexity & Google AI Overview Synthesis
DocMind synthesizes findings into an authoritative, executive-grade format:
* **Executive Summary:** Upfront authoritative overview answering the core question.
* **Structured GFM Comparison Tables:** Specs, metrics, and options formatted into clean GitHub-Flavored Markdown tables with zero raw HTML tags.
* **Grounded Citation Pills (`[1]`, `[2]`):** Clickable badges that smoothly scroll and pulse-highlight matching source cards.
* **Dual-Phase Source Filtering:** Only sources *actually cited in the synthesized text* appear in the bottom carousel; all evaluated candidates remain available in the full modal.

### 2. In-Memory Semantic LRU Caching
* **Instant Sub-15ms Latency:** Hashes normalized queries and context fingerprints into an in-memory LRU cache (`max_size=256`, 1-hour TTL).
* **Streaming Support:** Automatically streams cached responses smoothly to the client with sub-millisecond yields.
* **Zero Cloud Cost:** Eliminates duplicate API calls for identical or slightly rephrased questions, saving up to 40% of API quota.

### 3. Multi-Query Expansion & HyDE
* Bridges the semantic gap between informal queries (e.g. *"qubit temps"*) and formal technical documents (*"Superconducting qubits operate at millikelvin temperatures"*).
* Synthesizes hypothetical candidate document passages using the fast auxiliary Gemini model, embedding them and fusing results into RRF.

### 4. Distributed Tracing & Observability (Langfuse)
* Integrated following official Langfuse AI standards:
  * `@telemetry.observe(as_type="retriever")` on similarity search and hybrid RRF context assembly.
  * `@telemetry.observe(as_type="tool")` on web scrapers and external data fetching.
  * `CallbackHandler` attached to LangChain LLM invocations capturing token counts, latency, and TTFT.
  * `propagate_attributes(session_id=..., user_id=...)` linking full user journeys.
  * Non-blocking graceful degradation to local timing if cloud credentials are absent.

### 5. Multi-Engine Web Cascade & Cloud Anti-Throttling
* Cascades across `ddgs` (excluding Mojeek), direct **Bing HTML search**, **Google News RSS**, and **DuckDuckGo Lite**.
* **2.5s Fail-Fast Timeout:** Rapidly fails over rather than hanging streaming connections.
* **SSRF Shield:** Pre-resolves DNS and blocks loopback (`127.0.0.1`), private RFC1918 subnets (`10.x`, `172.16.x`, `192.168.x`), and cloud metadata (`169.254.169.254`).

---

## 💻 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 7, Tailwind CSS v4, Lucide Icons | Responsive research interface, interactive citation pills, streaming renderer |
| **Backend** | FastAPI, Uvicorn, Python 3.11+ | High-performance asynchronous REST and Server-Sent Events (SSE) gateway |
| **LLM & Embeddings** | Google Gemini Flash, `text-embedding-004` | Answer synthesis, HyDE expansion, 768-dim Matryoshka vector embeddings |
| **Vector Database** | Pinecone Serverless | Scalable cloud vector index with user namespace isolation |
| **Relational Database** | Supabase PostgreSQL | User accounts, chat history, document metadata, and BM25 full-text keyword search |
| **Observability** | Langfuse Cloud v5 | Distributed tracing, observation hierarchy, latency/token profiling, and eval logging |
| **Containerization** | Docker, Docker Compose | Multi-stage production container builds |
| **CI/CD** | GitHub Actions | Automated linting, regression testing, and Ragas AI eval quality gates |

---

## 📁 Project Directory Structure

```
DocMind/
├── .agents/                    # Langfuse AI Agent Skill & Instrumentation Guides
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD Pipeline & Automated Eval Gate
├── backend/
│   ├── app/
│   │   ├── api/                # FastAPI routes (auth, chat, documents, share)
│   │   ├── core/               # Config, database, telemetry, guardrails, auth
│   │   ├── services/           # Document, LLM, RAG, Vector, and Web Search services
│   │   └── main.py             # Application factory & CORS middleware
│   ├── tests/
│   │   ├── evals_ragas.py      # Automated Ragas evaluation benchmark suite
│   │   ├── eval_results.md     # Generated Ragas scorecard report
│   │   ├── test_full_rag_pipeline.py  # End-to-end RAG regression tests
│   │   ├── test_rag_chatbot.py        # Auth & tenant isolation tests
│   │   └── test_semantic_cache.py     # Semantic cache & HyDE unit tests
│   ├── Dockerfile              # Multi-stage production backend container
│   ├── pytest.ini              # Warning suppression & test configuration
│   └── requirements.txt        # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # Sidebar, Modals, Shared Chat Views
│   │   ├── features/Chat/      # ChatView, Tables, ResearchBar, Sources Carousel
│   │   └── App.jsx             # Main application container
│   ├── Dockerfile              # Production Nginx frontend container
│   └── package.json            # Frontend dependencies
├── docker-compose.yml          # Container orchestration (Backend + Frontend)
├── vercel.json                 # Vercel SPA routing configuration
└── README.md                   # Project documentation
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
* **Python 3.11+**
* **Node.js 18+** & **npm**
* Free accounts with:
  * [Google AI Studio](https://aistudio.google.com/) (Gemini API keys)
  * [Pinecone](https://www.pinecone.io/) (Free Serverless vector index: 768 dimensions, cosine metric)
  * [Supabase](https://supabase.com/) (Free PostgreSQL database)
  * [Langfuse](https://cloud.langfuse.com/) (Free distributed tracing cloud)

---

### Option A: Running with Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/siddhantsaxena45/DocMind.git
   cd DocMind
   ```

2. Create `backend/.env` with your API keys:
   ```env
   GOOGLE_API_KEY1=your_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX_NAME=docmind
   DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
   JWT_SECRET=super_secret_jwt_key
   LANGFUSE_PUBLIC_KEY=pk-lf-...
   LANGFUSE_SECRET_KEY=sk-lf-...
   LANGFUSE_BASE_URL=https://us.cloud.langfuse.com
   ```

3. Launch the full stack:
   ```bash
   docker compose up --build
   ```
   * Frontend: `http://localhost:3000`
   * Backend API: `http://localhost:8000`
   * Interactive API Docs: `http://localhost:8000/docs`

---

### Option B: Running Locally (Native)

#### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Quality Assurance

Run the comprehensive unit test, security regression, and caching suite:

```bash
cd backend

# 1. Run all core regression, security & semantic cache tests
pytest tests/test_full_rag_pipeline.py tests/test_rag_chatbot.py tests/test_semantic_cache.py -v

# 2. Run the quantitative Ragas evaluation suite
pytest tests/evals_ragas.py -s -v
```

**Test Output:**
```
tests/test_semantic_cache.py::test_semantic_response_cache_lifecycle PASSED [ 11%]
tests/test_semantic_cache.py::test_llm_service_cache_integration PASSED     [ 22%]
tests/test_semantic_cache.py::test_hyde_and_multi_query_helpers PASSED      [ 33%]
tests/test_full_rag_pipeline.py::test_document_parser_multi_format PASSED   [ 44%]
tests/test_full_rag_pipeline.py::test_web_search_service PASSED             [ 55%]
tests/test_full_rag_pipeline.py::test_end_to_end_rag_and_sharing_workflow PASSED [ 66%]
tests/test_rag_chatbot.py::test_health_check PASSED                         [ 77%]
tests/test_rag_chatbot.py::test_auth_workflow PASSED                        [ 88%]
tests/test_rag_chatbot.py::test_document_and_conversation_isolation PASSED [100%]
============================== 9 passed in ~45s ==============================
```

---

## 📡 API Reference

### Real-Time Chat Streaming (SSE)
`GET /api/conversations/{conversation_id}/messages/stream`

Streams Server-Sent Events (SSE) directly to the client:
```http
GET /api/conversations/123/messages/stream?text=explain+quantum+coherence&token=<JWT_TOKEN>&web_search=true HTTP/1.1
```

**SSE Event Channels:**
| Event | Payload | Purpose |
| :--- | :--- | :--- |
| `event: title` | `{"title": "..."}` | Updates conversation title dynamically based on intent |
| `event: research` | `{"query": "...", "status": "...", "sources_count": 5}` | Updates collapsible research status bar |
| `event: citations` | `[{"title": "...", "url": "...", "site_name": "...", "favicon": "..."}]` | Emits grounded citations matching `[1]`, `[2]` badges |
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
| `POST` | `/api/documents/upload` | Uploads documents, parses hyperlinks, indexes in Pinecone + Postgres |
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

## 🌐 Production Deployment

* **Frontend (Vercel):** Connected via Git integration to root directory `frontend/`. Included [`vercel.json`](vercel.json) handles SPA client-side routing for `/share/:token`.
* **Backend (Render / Docker):** Deployed using multi-stage [`backend/Dockerfile`](backend/Dockerfile) or native Python Web Service.
* **Database (Supabase):** Automatically provisions relational schema and RLS policies on first startup.

---

## 📄 License & Author

Developed by **[Siddhant Saxena](https://github.com/siddhantsaxena45)**  
Computer Science Undergraduate • AI & Full-Stack Developer  
* **GitHub:** [@siddhantsaxena45](https://github.com/siddhantsaxena45)  
* **LinkedIn:** [Siddhant Saxena](https://linkedin.com/in/siddhant-saxena)  
* **Repository:** [DocMind AI](https://github.com/siddhantsaxena45/DocMind)

Licensed under the **MIT License**. Free for educational, academic, and open-source use.
