# 🧠 DocMind: Production-Grade Multi-Agent Research Ecosystem

**DocMind transforms static documents into dynamic, verified intelligence. It isn't just a RAG bot—it's an autonomous AI workforce that audits, visualizes, and expands your research with surgical precision.**



## 📑 Table of Contents

1. [Executive Summary & Vision](#1-executive-summary--vision)
2. [The Unique Selling Proposition (USP)](#2-the-unique-selling-proposition-usp)
3. [Research Report: The Shift to Multi-Agent Systems](#3-research-report-the-shift-to-multi-agent-systems)
4. [Software Requirements Specification (SRS)](#4-software-requirements-specification-srs)
    - [4.1 Functional Requirements (Agent Capabilities)](#41-functional-requirements-agent-capabilities)
    - [4.2 Non-Functional Requirements](#42-non-functional-requirements)
5. [System Architecture & Data Flow](#5-system-architecture--data-flow)
6. [API Specification & Payloads](#6-api-specification--payloads)
7. [Comprehensive Setup Guide](#7-comprehensive-setup-guide)
8. [Testing & Quality Assurance](#8-testing--quality-assurance)

---

## 1. Executive Summary & Vision

### 1.1 Project Purpose
DocMind is engineered to automate the severe cognitive labor required when analyzing, verifying, and expanding upon dense textual documents. While modern Large Language Models (LLMs) are exceptionally good at summarizing text, they fail critically when asked to *verify* the objective truth of the text they are reading. 

DocMind solves this by orchestrating a suite of autonomous agents (powered by CrewAI) that act as an investigative team. Whether deployed for HR professionals rigorously screening technical resumes, or academics deconstructing complex distributed systems research papers, DocMind acts as an active investigator rather than a passive reader.

### 1.2 Target Personas
1. **The Academic Researcher**: Uses the *Paper Analyzer* to extract methodologies and the *Knowledge Graph* to find hidden ontological correlations across literature.
2. **The HR Technical Recruiter**: Uses the *Authenticity Auditor* to physically scrape provided GitHub links on a resume to verify claims, utilizing the *ATS Optimizer* to standardize candidate scoring.
3. **The Software Architect**: Uses the *Code Generator* to instantly scaffold boilerplate based on an uploaded specification, relying on the *Research Agent* to find external API documentation.

---

## 2. The Unique Selling Proposition (USP)

In an ecosystem saturated with simple "Chat with PDF" wrappers (standard Retrieval-Augmented Generation), DocMind differentiates itself through **Action-Oriented Verification**.

### 2.1 The "Link-First" Verification Methodology
When a user uploads a resume claiming a "9.0 GPA" or a "React Redux application," a standard LLM cannot verify this; it simply regurgitates the text. 

DocMind's USP is its **Authenticity Auditor Agent**. 
1. **Extraction**: It scans hidden PDF annotations using PyPDF to find personal URLs (LinkedIn, LeetCode, GitHub).
2. **Scraping**: It uses Trafilatura and randomized HTTP headers to physically navigate to those specific links.
3. **Grounding**: It searches those specific pages for the claims made in the document *before* doing a general web search, drastically reducing hallucinated conflicts caused by namesakes.

### 2.2 Conflict vs. Evolution Logic
A major flaw in generic RAG is the inability to understand temporal evolution. If a document states a target graduation of 2026 with a 9.0 CGPA, but the web shows an older 2024 archive with an 8.2 CGPA, standard bots flag this as a lie. DocMind's prompts are explicitly engineered to distinguish between *contradictory facts* and *evolved timelines*, offering unparalleled accuracy in HR tech screening.

### 2.3 Competitive Analysis
| Capability | DocMind (Multi-Agent System) | Standard RAG (ChatGPT / Gemini) |
| :--- | :--- | :--- |
| **Verification** | **Active Investigation**: Scrapes document-provided links to verify specific claims in real-time. | **Passive Retrieval**: Relies solely on static training data or generic, unfocused web browsing. |
| **Orchestration** | **Role-Based Pipelines**: A 'Recruiter' agent critiques the output of an 'ATS' agent. | **Single-Shot**: One prompt attempts to do everything, leading to shallow analysis. |
| **Visual Mapping** | **Physics-Based SVG Graphs**: Interactive D3.js knowledge maps derived directly from text. | **Text Only**: Generates markdown tables at best. |
| **Reliability** | **API Key Rotation & Cache**: Fallback routing and Supabase JSONB persistence. | **Quota Limited**: Frequent timeout/429 errors during heavy document processing. |

---

## 3. Research Report: The Shift to Multi-Agent Systems

*This section provides the theoretical underpinning for DocMind's architecture.*

### 3.1 The Limitations of Standard RAG
Retrieval-Augmented Generation (RAG) solved the initial problem of LLM knowledge cutoffs by injecting retrieved document chunks into the prompt context via Vector Databases. However, standard RAG suffers from severe limitations:
1. **The Static Context Problem**: RAG inherently assumes the provided document is the absolute truth. If a document contains fabricated data (e.g., a faked credential), standard RAG will confidently parrot that fabrication as fact.
2. **Context Fragmentation ("Lost in the Middle")**: When querying a massive document, retrieving the "Top K" chunks often fragments the narrative. A methodology described on page 2 might mathematically rely on an equation on page 40. Chunking breaks this semantic link.

### 3.2 The Multi-Agent Solution (MAS)
DocMind abandons the monolithic single-prompt paradigm in favor of a Multi-Agent System (MAS). By instantiating distinct agents using **CrewAI**, the system achieves **Cognitive Separation of Concerns**.

- **Tool Use & Environmental Interaction**: Standard LLMs are closed systems. DocMind's agents are open systems. They interact with their environment via specialized tools (`web_search` via DDGS and `read_web_page` via Trafilatura). 
- **Iterative Refinement**: The "Senior Engineering Recruiter" agent does not just read the raw text; it reads the highly-structured output of the "ATS Scanner" agent first. This mimics human collaborative workflows and drastically reduces context window pollution.

### 3.3 Mitigating Hallucinations in Vector Space
To solve Context Fragmentation, DocMind utilizes **Pinecone Isolated Namespaces**. Instead of dumping all embeddings into a single index pool (which leads to catastrophic cross-document hallucination), every document is indexed into a unique namespace tied to a secure `user_id`. The vector search space is cryptographically bound, ensuring a 0% cross-contamination rate.

---

## 4. Software Requirements Specification (SRS)

### 4.1 Functional Requirements (Agent Capabilities)

DocMind operates 9 distinct AI agent pipelines, each rigorously defined:

#### FR-1: The Authenticity Auditor
- **Requirement**: The system must extract URLs from the document, visit those URLs, and cross-reference them against 3-5 core claims extracted from the text.
- **Output**: A strict JSON object containing a confidence score, a list of verified claims with live-web evidence snippets, and a list of unverified anomalies.

#### FR-2: Knowledge Graph Studio
- **Requirement**: The system must extract ontological relationships representing the core concepts of the text.
- **Output**: A JSON array defining `source`, `target`, `relation`, `confidence` (0-100), and `evidence` (a 10-word justification).

#### FR-3: The ATS & Recruiter Pipeline
- **Requirement**: A dual-agent system where Agent A scores the document against a Job Description, and Agent B rewrites the 3 weakest bullet points.
- **Constraint**: Agent B must strictly utilize the **STAR Method** (Situation, Task, Action, Result) for all rewrites.

#### FR-4: Scientific Paper Analyzer
- **Requirement**: The system must deconstruct academic literature into core Hypothesis, Methodology (bulleted sequence), Datasets Used, Limitations, and Future Scope.

#### FR-5: Advanced Research Synthesis
- **Requirement**: The system must perform multi-hop web searches independent of the uploaded document to expand on a user query.
- **Thread Safety**: Searches must utilize Python `threading.local()` to prevent User A from seeing User B's search history during concurrent API requests.

#### FR-6: Source Credibility Engine
- **Requirement**: The system must evaluate the URLs retrieved by FR-5, scoring them based on domain authority heuristics and identifying inherent bias (Neutral vs. Biased).

#### FR-7 through FR-9: Utilities
- System must provide multi-level Text Summarization.
- System must generate Anki-compatible Flashcards.
- System must generate boilerplate Code structures derived from textual specifications.

### 4.2 Non-Functional Requirements

#### NFR-1: Performance & Latency
- **Static Routes**: Fetching cached results from Supabase must resolve in `< 200ms`.
- **Agentic Routes**: Asynchronous web-scraping pipelines may take up to `250 seconds`. They must utilize FastAPI's `async def` and `asyncio.to_thread` to prevent blocking the main event loop.
- **Frontend**: The D3.js physics graph must maintain 60 FPS under a load of 100 nodes.

#### NFR-2: Reliability & API Key Rotation
- **Requirement**: The system must implement an `APIKeyRotator` singleton. 
- **Trigger**: Upon receiving `RESOURCE_EXHAUSTED` (429) or `INVALID_API_KEY` errors, the system must immediately cycle the array of Google Gemini API keys to ensure uninterrupted service.

#### NFR-3: Persistence & Feature Caching
- **Requirement**: Running Agent pipelines is computationally expensive. The system must utilize PostgreSQL `JSONB` columns in Supabase to cache the exact JSON output of a feature request. If a user requests a Knowledge Graph twice, the second request must instantly return the cached JSONB object.

---

## 5. System Architecture & Data Flow

DocMind is a polyglot microservice architecture, leveraging React/Vite on the client and Python/FastAPI on the server.

### 5.1 Architecture Diagram

```mermaid
graph TD
    Client[React + Vite Frontend] -->|HTTP POST| Gateway(FastAPI Gateway)
    
    Gateway --> Router{Task Router}
    
    Router -->|RAG Retrieval| VectorDB[(Pinecone Vector DB)]
    Router -->|Agentic Processing| Orchestrator[CrewAI MAS Orchestrator]
    Router -->|State & Cache| RelationalDB[(Supabase PostgreSQL)]
    
    Orchestrator --> Agent1[Investigative Agent]
    Orchestrator --> Agent2[Recruiter Agent]
    Orchestrator --> Agent3[Research Agent]
    
    Agent1 --> Scraper((Trafilatura + DDGS))
    Agent3 --> Scraper
    
    RelationalDB -->|JSONB Hydration| Client
```

### 5.2 The Frontend React Flow
The frontend utilizes a highly-optimized Context API state architecture. To provide a "Glassmorphic" premium feel, vanilla CSS with advanced backdrop filters is used heavily.
- **Tab Persistence**: When users switch between the 9 feature tabs, local component state is preserved to avoid re-rendering heavy D3 physics models.
- **Error Normalization**: The UI gracefully handles 503 Overload errors and 429 Rate Limits by rendering human-readable "Quota Exhausted" alerts rather than raw backend stack traces.

---

## 6. API Specification & Payloads

The FastAPI backend exposes fully typed, validated endpoints.

### 6.1 Authentication & Document Processing

**POST `/api/v1/upload`**
- **Description**: Ingests a PDF, chunks it using `RecursiveCharacterTextSplitter`, extracts metadata, and indexes into Pinecone under a unique `user_id` namespace.

### 6.2 Agentic Intelligence Endpoints

**POST `/api/v1/document/{document_id}/verify`**
- **Query Params**: `user_id` (string, required), `force` (boolean, defaults to false to allow caching).
- **Description**: Triggers the Authenticity Auditor.
- **Response Shape**:
```json
{
  "score": 85,
  "verified_sources": [
    {
      "claim": "Maintained a 9.0 GPA across 6 semesters.",
      "sources": ["https://university.edu/records/123"],
      "status": "Verified",
      "evidence_snippet": "Cumulative GPA: 9.02 as of Fall 2025."
    }
  ],
  "unverified_claims": [
    {
      "claim": "Deployed a 10,000 MAU application.",
      "reason": "Could not find evidence of traffic metrics on the provided GitHub repository or live URL.",
      "status": "Unverified"
    }
  ],
  "cached": false
}
```

**POST `/api/v1/document/{document_id}/resume-critique`**
- **Body Payload**: `{"job_description": "We are looking for a Senior React Developer..."}`
- **Response Shape**:
```json
{
  "ats_score": 72,
  "missing_sections_or_keywords": ["Docker", "CI/CD Pipeline", "TypeScript"],
  "bullet_rewrites": [
    {
      "original": "Worked on the backend database.",
      "suggestion": "Designed and optimized PostgreSQL database schemas, reducing average query latency by 40% and improving overall application throughput."
    }
  ],
  "overall_feedback": "Strong foundational project experience, but lacking explicit mention of deployment strategies required by the JD."
}
```

---

## 7. Comprehensive Setup Guide

### 7.1 System Prerequisites
- Python 3.10+
- Node.js 18+
- Supabase Project (PostgreSQL)
- Pinecone Index (Dimension: 768, Metric: Cosine)

### 7.2 Environment Variable Configuration
Create a `.env` file in the `backend/` directory:

```bash
# Core AI Intelligence
GOOGLE_API_KEY1=AIzaSyYourKeyHere...
GOOGLE_API_KEY2=AIzaSyOptionalRotationKey... # Crucial for failover

# Vector Database (RAG)
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=docmind-workspace

# Relational Persistence (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
JWT_SECRET=your_jwt_signing_secret
```

### 7.3 Backend Deployment (FastAPI)
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the uvicorn server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The interactive Swagger API documentation will be instantly available at `http://localhost:8000/docs`.

### 7.4 Frontend Deployment (Vite + React)
```bash
# Navigate to frontend
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```
Access the application at `http://localhost:5173`.

---

## 8. Testing & Quality Assurance

### 8.1 Backend Verification
DocMind is built to handle failure gracefully.
- **Failover Testing**: The `APIKeyRotator` is tested by intentionally providing an expired API key as `GOOGLE_API_KEY1` and a valid key as `GOOGLE_API_KEY2`. The system must seamlessly catch the 401 error, rotate the index, and re-attempt the CrewAI execution without returning an HTTP 500 to the client.
- **Concurrent Request Limits**: Because CrewAI agents are computationally heavy, FastAPI limits maximum active worker threads to prevent out-of-memory (OOM) errors during simultaneous agent dispatches.

### 8.2 Frontend UI Audits
- **Responsive Layouts**: The UI relies heavily on Flexbox and Grid. The `Paper Analyzer` and `Research Agent` are specifically optimized (`max-w-[1600px]`) to ensure ultra-wide monitor users do not experience left-shifted or collapsed grid panels.
- **Accessibility**: All interactive elements utilize semantic HTML to ensure screen reader compatibility, and contrasting colors (Emerald, Amber, Red) are used to dictate system status (Verified vs. Unverified claims).

---

## 👤 Author & Maintainer
**Siddhant**

*Designed and engineered for the era of high-fidelity, verified, and autonomous research. DocMind represents the definitive shift from passive text retrieval to active, agentic intelligence.*
