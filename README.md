# 🧠 DocMind: Production-Grade Multi-Agent Research Ecosystem

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![CrewAI](https://img.shields.io/badge/CrewAI-Orchestration-orange?style=for-the-badge)](https://www.crewai.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-blue?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-black?style=for-the-badge)](https://www.pinecone.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

> **DocMind transforms static documents into dynamic, verified intelligence. It isn't just a RAG bot—it's an autonomous AI workforce that audits, visualizes, and expands your research with surgical precision.**

---

## 🚀 The DocMind Differentiator

In an era of generic LLM wrappers, DocMind provides a specialized **Research & Verification Engine** that standard bots cannot match.

| Feature | DocMind | ChatGPT / Gemini / Claude |
| :--- | :--- | :--- |
| **Verification Logic** | **Link-First Auditor**: Scans hidden PDF annotations for URLs and verifies them via live web scraping. | Basic web browsing; lacks specific "verification" goal-setting. |
| **Conflict Resolution** | **Evolution-Aware**: Distinguishes between outdated web data and recent document claims (e.g., Target GPAs). | Often flags temporal differences as "hallucinations". |
| **Knowledge Display** | **Physics-Based Graphs**: Interactive SVG entity-relationship mapping. | Text-only hierarchical responses. |
| **Orchestration** | **Multi-Agent Autonomy**: Specialized agents (Auditor, Researcher, Recruiter) use tools in loops. | Single-shot prompt execution. |
| **Reliability** | **Key Rotation & Persistence**: Automatic key cycling and PostgreSQL payload caching. | Subject to standard individual quota limits. |

---

## 🏗️ System Design 2.0 (Architectural Layers)

DocMind is built on a modular, decoupled architecture designed for high throughput and reliability.

### **1. Presentation Layer (React + Vite)**
- **Glassmorphic UI**: High-end aesthetic using vanilla CSS and Lucide icons.
- **State Management**: Persistence-aware tab system with real-time payload hydration from PostgreSQL.
- **Visualization**: D3-driven physics simulation for entity relationship graphs.

### **2. Control & API Layer (FastAPI)**
- **Asynchronous Hub**: Handles concurrent agentic tasks without blocking.
- **Auth & Security**: JWT-based session management and user-isolated document silos.
- **Normalization**: Standardizes multi-modal LLM errors into stable HTTP responses for the frontend.

### **3. Agentic & Intelligence Layer (CrewAI + Gemini)**
- **Orchestrator**: CrewAI manages role-based agents (Knowledge Engineer, Investigative Auditor, etc.).
- **Intelligence**: Gemini 2.5 Flash series for cost-effective, high-context reasoning.
- **Key Rotator**: Proprietary logic to cycle between multiple API keys, handling `BAD_RECORD_MAC` and rate limits automatically.

### **4. Data & Persistence Layer**
- **Relational (PostgreSQL)**: Stores user metadata, document history, and a **Feature Cache** (JSONB) to persist AI results across sessions.
- **Vector (Pinecone)**: Serverless vector indexing with **Isolated Namespaces** per document/user.

---

## 🔍 Granular Feature Breakdown

### **📄 Document Processing & Ingestion**
- **Hybrid Extraction**: Parses visible text and **hidden hyperlink annotations** (via PyPDF).
- **Smart Chunking**: `RecursiveCharacterTextSplitter` (800/100 overlap) ensures semantic continuity.
- **Isolated Indexing**: Every document gets its own namespace in Pinecone, preventing cross-document hallucination.

### **🛡️ Authenticity Auditor (The Investigative Agent)**
- **URL Prioritization**: Automatically scans the `[DOC_LINKS]` section to verify personal profiles (LinkedIn, GitHub) first.
- **Deep Scraping**: Uses `Trafilatura` with randomized User-Agents and realistic headers to bypass scraper-blocks.
- **Conflict vs Evolution**: Logic-gate that understands document claims might be *newer* than existing web data.
- **Fallback Chains**: Automatically switches to single-shot LangChain verify if CrewAI orchestration fails.

### **🕸️ Knowledge Graph Studio**
- **Ontological Extraction**: Extracts entities (Source/Target) and relationship types (Confidence/Evidence).
- **SVG Physics View**: Nodes repel/attract based on relationship density, allowing for intuitive discovery of hidden links.

### **🔬 Advanced Research Hub**
- **Multi-Hop Search**: Researcher agent identifies gaps in the PDF and performs independent DuckDuckGo searches.
- **Source Credibility**: Evaluator agent rates search results based on domain authority and relevance.
- **Report Synthesis**: Generates professional Markdown reports with inline citations.

### **💼 Professional Agents (Resume & Paper)**
- **ATS Scanner**: Ruthless scoring against Job Descriptions (JD) to identify keyword gaps.
- **Senior Recruiter**: Critique using the **STAR Method**, suggesting high-impact metric-driven rewrites.
- **Paper Analyzer**: Methodology breakdown, future work extraction, and citation reliability auditing.

---

## 🛠️ Tech Stack & Rationale

- **FastAPI**: Chosen for its native `async` support—essential for long-running agentic tasks.
- **CrewAI**: Provides **Role-Based Autonomy**, making agents more effective than simple LLM chains.
- **Gemini Flash**: 1M+ token context window allows processing entire technical papers in a single pass.
- **Pinecone**: Serverless architecture scales to millions of vectors without infrastructure management.
- **Trafilatura**: High-precision text extraction from web pages, stripping out ads and boilerplate.

---

## 🚀 Getting Started

### **Environment Configuration (.env)**
```bash
# Required for Intelligence
GOOGLE_API_KEY1=your_key_here
GOOGLE_API_KEY2=optional_rotation_key

# Required for RAG
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=doc-workspace

# Required for Persistence
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=your_secret
```

### **1. Backend Deployment**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### **2. Frontend Deployment**
```bash
cd frontend
npm install
npm run dev
```

---

## 👤 Author
**Siddhant**

---
*Created for the era of high-fidelity, verified research.*

