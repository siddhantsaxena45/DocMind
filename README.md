# 🧠 DocMind: Production-Grade Multi-Agent Research Ecosystem
## Comprehensive Software Requirements Specification (SRS), Unique Selling Proposition (USP), and Research Report

---

> **DocMind transforms static documents into dynamic, verified intelligence. It isn't just a RAG bot—it's an autonomous AI workforce that audits, visualizes, and expands your research with surgical precision.**

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![CrewAI](https://img.shields.io/badge/CrewAI-Orchestration-orange?style=for-the-badge)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-blue?style=for-the-badge&logo=google-gemini)
![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-black?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

---

## 📑 Table of Contents

1. [Executive Summary & Unique Selling Proposition (USP)](#1-executive-summary--unique-selling-proposition-usp)
2. [Introduction & Project Scope](#2-introduction--project-scope)
3. [Software Requirements Specification (SRS)](#3-software-requirements-specification-srs)
    - [Functional Requirements](#31-functional-requirements)
    - [Non-Functional Requirements](#32-non-functional-requirements)
    - [User Roles & Personas](#33-user-roles--personas)
4. [Architectural Design & Data Flow](#4-architectural-design--data-flow)
    - [Frontend Architecture](#41-frontend-architecture)
    - [Backend Architecture](#42-backend-architecture)
    - [Persistence & Database](#43-persistence--database)
5. [Detailed Feature Workflows (Deep Dive)](#5-detailed-feature-workflows-deep-dive)
    - [5.1 Document Authenticity Auditor](#51-document-authenticity-auditor)
    - [5.2 Knowledge Graph Studio](#52-knowledge-graph-studio)
    - [5.3 Advanced Research Agent](#53-advanced-research-agent)
    - [5.4 Resume & ATS Optimizer](#54-resume--ats-optimizer)
    - [5.5 Scientific Paper Analyzer](#55-scientific-paper-analyzer)
    - [5.6 Code Generator](#56-code-generator)
    - [5.7 Flashcard Generator](#57-flashcard-generator)
    - [5.8 Source Credibility Engine](#58-source-credibility-engine)
    - [5.9 Text Summarizer](#59-text-summarizer)
6. [API Specification](#6-api-specification)
7. [Tech Stack & Integration Rationale](#7-tech-stack--integration-rationale)
8. [Research Report: The Evolution of Document Intelligence](#8-research-report-the-evolution-of-document-intelligence)
9. [Comprehensive Deployment Guide](#9-comprehensive-deployment-guide)
10. [Testing & Quality Assurance](#10-testing--quality-assurance)
11. [Future Roadmap](#11-future-roadmap)

---

## 1. Executive Summary & Unique Selling Proposition (USP)

### 1.1 The Problem
In an era saturated with generic Large Language Model (LLM) wrappers and basic Retrieval-Augmented Generation (RAG) applications, users face significant challenges:
1. **Hallucinations**: LLMs confidently invent facts when context is missing.
2. **Context Window Limitations**: Processing dense, 50-page scientific papers often exceeds standard token limits or degrades the LLM's reasoning capability ("Lost in the Middle" phenomenon).
3. **Static Analysis**: Most tools only analyze the document in isolation. They cannot venture out to the live web to verify if the claims within the document are actually true.
4. **Lack of Specialization**: A single prompt trying to grade a resume, analyze a scientific paper, and check facts simultaneously results in shallow, mediocre outputs.

### 1.2 The DocMind Solution (USP)
DocMind provides a specialized **Research & Verification Engine** that standard chatbots cannot match. Instead of relying on a single, monolithic LLM prompt, DocMind deploys a **Multi-Agent Orchestration Framework (CrewAI)**.

**Key Differentiators:**

| Feature | DocMind's Multi-Agent Ecosystem | Standard Chatbots (ChatGPT / Gemini / Claude) |
| :--- | :--- | :--- |
| **Verification Logic** | **Link-First Auditor**: Scans hidden PDF annotations for URLs and verifies them via live web scraping using Trafilatura. | Basic web browsing; lacks specific "verification" goal-setting and prioritizes generic search. |
| **Conflict Resolution** | **Evolution-Aware**: Distinguishes between outdated web data and recent document claims (e.g., Target GPAs). | Often flags temporal differences as "hallucinations" due to static training data cutoffs. |
| **Knowledge Display** | **Physics-Based Graphs**: Interactive SVG entity-relationship mapping powered by D3.js. | Text-only hierarchical responses and markdown tables. |
| **Orchestration** | **Multi-Agent Autonomy**: Specialized agents (Auditor, Researcher, Recruiter) use tools in sequential loops. | Single-shot prompt execution with limited cognitive step-back capability. |
| **Reliability** | **Key Rotation & Persistence**: Automatic API key cycling and Supabase-managed JSONB payload caching. | Subject to standard individual quota limits and frequent timeout errors. |

DocMind isn't a passive tool; it's an **active investigator**. If an applicant claims to have built a "React Redux Application" on their resume, DocMind will extract their provided GitHub link, navigate to the repository, scrape the `package.json`, and verify the claim in real-time.

---

## 2. Introduction & Project Scope

### 2.1 Project Purpose
The purpose of DocMind is to automate the cognitive labor associated with reading, analyzing, verifying, and expanding upon dense textual documents. This is particularly targeted at HR professionals screening resumes, academics reviewing scientific literature, and researchers synthesizing large volumes of text.

### 2.2 Scope of the Document
This README serves as the complete operational, architectural, and business document for the DocMind repository. It is intended for:
- **Developers**: To understand the codebase, API routes, and agent logic.
- **System Architects**: To evaluate the scalability, security, and integration of Supabase, Pinecone, and FastAPI.
- **Product Managers**: To understand the feature set and future roadmap.
- **Academics/Researchers**: To review the embedded Research Report detailing the theoretical underpinnings of Multi-Agent Systems (MAS) in Document Intelligence.

---

## 3. Software Requirements Specification (SRS)

### 3.1 Functional Requirements

#### FR-1: Document Ingestion & Parsing
- **FR-1.1**: The system must accept `.txt` and `.pdf` files.
- **FR-1.2**: The system must extract hidden hyperlink annotations from PDF files.
- **FR-1.3**: Text must be chunked using a `RecursiveCharacterTextSplitter` to maintain semantic meaning.

#### FR-2: Multi-Agent AI Features
- **FR-2.1 (Authenticity)**: The system must verify claims in the document by searching the live web and reading external URLs.
- **FR-2.2 (Knowledge Graph)**: The system must extract Source, Target, Relation, Confidence, and Evidence from the text.
- **FR-2.3 (Research Agent)**: The system must perform autonomous web searches to expand on the document's topic and provide a cited report.
- **FR-2.4 (Resume Optimization)**: The system must act as an ATS scanner and a technical recruiter, rewriting bullet points using the STAR method.
- **FR-2.5 (Paper Analyzer)**: The system must analyze scientific papers for methodology, findings, and citation reliability.
- **FR-2.6 (Code Generation)**: The system must generate boilerplate code based on document specifications.
- **FR-2.7 (Flashcards)**: The system must generate active-recall flashcards from the text.
- **FR-2.8 (Credibility Scoring)**: The system must evaluate the credibility of sources using domain authority heuristics.
- **FR-2.9 (Summarization)**: The system must provide multi-level summarizations.

#### FR-3: Vector Search & RAG
- **FR-3.1**: The system must index document chunks into Pinecone.
- **FR-3.2**: The system must enforce Isolated Namespaces per user/document to prevent cross-document hallucination.

### 3.2 Non-Functional Requirements

#### NFR-1: Performance & Latency
- **NFR-1.1**: Static API routes (e.g., fetching cached results) must respond in under 200ms.
- **NFR-1.2**: Asynchronous agent tasks (e.g., web research) may take up to 250 seconds but must not block the main FastAPI thread.
- **NFR-1.3**: The React frontend must maintain a consistent 60 FPS during physics-based graph rendering.

#### NFR-2: Reliability & Fault Tolerance
- **NFR-2.1**: The system must implement an `api_key_rotator` to automatically switch LLM API keys upon hitting rate limits (HTTP 429) or authentication errors.
- **NFR-2.2**: The system must provide fallback mechanisms (e.g., falling back to a direct LangChain call if CrewAI orchestration fails).

#### NFR-3: Security & Privacy
- **NFR-3.1**: Web scraping tools (Trafilatura) must use rotating User-Agents and realistic headers to prevent IP blocking.
- **NFR-3.2**: User sessions must be secured via JWT.

### 3.3 User Roles & Personas
1. **The Academic Researcher**: Uploads 40-page PDFs. Uses the Paper Analyzer and Knowledge Graph to find hidden correlations between methodologies.
2. **The HR Recruiter**: Uploads 100+ resumes. Uses the Authenticity Auditor to verify GitHub links and the ATS Optimizer to standardize candidate scores.
3. **The Software Engineer**: Uploads technical specifications. Uses the Code Generator to scaffold boilerplates and the Research Agent to find documentation on new libraries.

---

## 4. Architectural Design & Data Flow

DocMind is built on a modular, decoupled architecture designed for high throughput and reliability.

### 4.1 Frontend Architecture (React + Vite)
- **Framework**: React 18 with Vite for blazing-fast Hot Module Replacement (HMR).
- **Styling**: Vanilla CSS utilizing Glassmorphic UI paradigms, CSS variables for theming, and smooth transitions.
- **State Management**: Context API and local component state. The application features a persistent tab system that remembers the user's active view.
- **Visualization**: D3.js physics simulations. Nodes represent entities; edges represent relationships. The physics engine handles collision detection and gravity.

### 4.2 Backend Architecture (FastAPI)
- **Framework**: FastAPI (Python 3.10+) leveraging standard Python type hints for data validation via Pydantic.
- **Concurrency**: Asynchronous routes (`async def`) handle non-blocking IO operations. Heavy CPU-bound AI tasks are offloaded.
- **Agent Orchestration**: CrewAI manages the lifecycle of AI agents. It assigns roles, goals, tools (DuckDuckGo, Trafilatura), and memory.

```mermaid
graph TD
    A[Client UI] -->|HTTP POST| B(FastAPI Gateway)
    B --> C{Task Router}
    C -->|Vector Ops| D[Pinecone Service]
    C -->|Agent Ops| E[CrewAI Orchestrator]
    C -->|Persistence| F[(Supabase PostgreSQL)]
    
    E --> G[Investigative Agent]
    E --> H[Research Agent]
    E --> I[ATS Agent]
    
    G --> J((Live Web Scraper))
    H --> J
```

### 4.3 Persistence & Database (Supabase + Pinecone)
- **Supabase**: Serves as the primary relational database. It utilizes PostgreSQL's `JSONB` column types to store the complex, nested JSON outputs from the AI agents. This "Feature Cache" prevents users from having to re-run expensive AI tasks on the same document.
- **Pinecone**: Serves as the Vector Database. Text is converted into dense vector embeddings using Google's embedding models and stored here. Crucially, DocMind uses Pinecone's **Namespaces** feature to isolate documents.

---

## 5. Detailed Feature Workflows (Deep Dive)

This section details the internal mechanics, prompt engineering strategies, and code logic for the 9 core AI features located in `backend/app/ai_features/`.

### 5.1 Document Authenticity Auditor (`document_authenticity.py`)
This is the crown jewel of DocMind's verification capabilities.

**The Logic Flow:**
1. **Tool Definition**: It utilizes two custom tools: `web_search` (using `ddgs.text`) and `read_web_page` (using `httpx` and `trafilatura` to bypass anti-bot mechanisms).
2. **The Agent**: The "Investigative Fact Checker" is instantiated with a specific backstory demanding skepticism and a strict adherence to a "Link-First" verification methodology.
3. **The Task**: 
   - Extract links from the document.
   - Extract claims.
   - Visit the provided links first. If an applicant provides a LinkedIn URL, the agent MUST scrape that URL before doing a general web search.
   - Apply "Conflict Resolution". The prompt explicitly instructs the LLM: *“a '9.09 CGPA' in a 2026/2027 document IS NOT contradicted by an 8.2 CGPA found in an older 2024 web source.”*
4. **Fallback Mechanism**: If all API keys fail during the complex CrewAI orchestration, it gracefully degrades to a single-shot LangChain prompt to provide a basic analysis without live web scraping.

### 5.2 Knowledge Graph Studio (`knowledge_graph.py`)
Extracts ontological relationships to build visual graphs.

**The Logic Flow:**
1. **The Agent**: The "Knowledge Engineer".
2. **The Task**: The LLM is instructed to extract up to 20 high-quality edges. For every edge, it must strictly return: `source`, `target`, `relation`, `confidence` (0-100), and `evidence` (a 10-word snippet justifying the link).
3. **Frontend Integration**: The JSON array returned is parsed by the React frontend and fed directly into a D3 force-directed graph.

### 5.3 Advanced Research Agent (`research_agent.py`)
Conducts autonomous multi-hop research.

**The Logic Flow:**
1. **Concurrency Safety**: Because multiple users might request research simultaneously, the code uses Python's `threading.local()` to store the sources (`_thread_local.sources`). This prevents User A from seeing User B's search history.
2. **The Task**: The agent uses DuckDuckGo to find URLs, reads the full HTML content of the top 3 URLs using Trafilatura, and synthesizes a Markdown report with inline citations (e.g., `[1]`).

### 5.4 Resume & ATS Optimizer (`resume_agent.py`)
A dual-agent system simulating an HR pipeline.

**The Logic Flow:**
1. **Agent 1: ATS Scoring System**: Parses the resume strictly for formatting and keywords against a provided Job Description. Outputs a base score out of 100.
2. **Agent 2: Senior Engineering Recruiter**: Takes the output of Agent 1 and critiques it. It enforces the **STAR Method** (Situation, Task, Action, Result) and rewrites the weakest bullet points into quantifiable, high-impact statements.

### 5.5 Scientific Paper Analyzer (`paper_analyzer.py`)
Deconstructs academic literature.
- Extracts the core Hypothesis.
- Evaluates the Methodology for flaws or sample size issues.
- Summarizes the Findings.
- Identifies "Future Work" to help researchers find gaps in the literature.

### 5.6 Code Generator (`code_generation.py`)
Parses technical documents and generates relevant code.
- Capable of generating boilerplate templates, database schemas, or API routes based on the system design specified in the uploaded document.

### 5.7 Flashcard Generator (`flashcard_generator.py`)
Educational tool for active recall.
- Parses the document and generates a JSON array of `{"question": "...", "answer": "..."}` objects, ideal for exporting to Anki or Quizlet.

### 5.8 Source Credibility Engine (`source_credibility.py`)
Evaluates the trustworthiness of references.
- Analyzes domains, cross-references with known credible sources, and provides a "Trust Score" alongside potential biases found in the text.

### 5.9 Text Summarizer (`summarizer.py`)
Provides Multi-level summaries (TL;DR, Executive Summary, Detailed Chapter-by-Chapter breakdown).

---

## 6. Tech Stack & Integration Rationale

| Technology | Role | Rationale & Justification |
| :--- | :--- | :--- |
| **FastAPI** | Backend Framework | Chosen for native `async` support. When an AI agent takes 45 seconds to scrape the web, FastAPI's asynchronous event loop ensures other users are not blocked. |
| **CrewAI** | Agent Orchestrator | Superior to LangChain's basic agents. CrewAI allows assigning specific roles, backstories, and sequential processing pipelines, making multi-agent collaboration feasible. |
| **Google Gemini 2.5 Flash** | Core LLM | Flash provides an unparalleled 1M+ token context window at a fraction of the cost of GPT-4, allowing DocMind to process entire 50-page PDFs in a single API call without aggressive chunking. |
| **Supabase (PostgreSQL)** | Database | Serves as a robust Backend-as-a-Service (BaaS). The native JSONB support is critical for caching unstructured AI responses. |
| **Pinecone** | Vector DB | Serverless architecture. The Namespaces feature provides hard isolation between documents, preventing data leakage. |
| **Trafilatura** | Web Scraper | Radically more precise than BeautifulSoup. It automatically strips headers, footers, ads, and boilerplate, returning only the core content necessary for the LLM. |
| **Vite + React** | Frontend | Instant server start and HMR drastically improve DX (Developer Experience). |

---

## 7. API Specification

DocMind's FastAPI backend exposes several RESTful endpoints.

### 7.1 Agentic Endpoints

**POST `/api/v1/analyze/authenticity`**
- **Description**: Triggers the Investigative Fact Checker.
- **Payload**: `{"text": "document text...", "doc_id": "12345"}`
- **Response**:
```json
{
  "score": 85,
  "verified_sources": [
    {
      "claim": "Developed a React Native application",
      "sources": ["https://github.com/user/repo"],
      "status": "Verified",
      "evidence_snippet": "Repository contains standard React Native file structure."
    }
  ],
  "unverified_claims": []
}
```

**POST `/api/v1/analyze/resume`**
- **Description**: Triggers the ATS & Recruiter Agents.
- **Payload**: `{"text": "resume text...", "job_description": "optional JD text"}`
- **Response**:
```json
{
  "ats_score": 72,
  "missing_sections_or_keywords": ["Docker", "CI/CD"],
  "bullet_rewrites": [
    {
      "original": "Worked on backend database.",
      "suggestion": "Designed and optimized PostgreSQL schemas, reducing query latency by 40%."
    }
  ],
  "overall_feedback": "Strong project experience, but lacking explicit mention of deployment strategies."
}
```

---

## 8. Research Report: The Evolution of Document Intelligence

*This section serves as a formal academic/technical report justifying the architectural decisions made in DocMind.*

### 8.1 The Limitations of Standard RAG
Retrieval-Augmented Generation (RAG) solved the initial problem of LLM knowledge cutoffs by injecting retrieved document chunks into the prompt context. However, standard RAG suffers from severe limitations:
1. **The Static Context Problem**: RAG assumes the provided document is the absolute truth. If a document contains fabricated data (e.g., a fake credential in a resume), standard RAG will confidently parrot that fabrication.
2. **Context Fragmentation**: When querying a large document, retrieving the "Top K" chunks often fragments the narrative. A methodology described on page 2 might rely on an equation on page 40.

### 8.2 The Multi-Agent Solution (MAS)
DocMind abandons the single-prompt paradigm in favor of a Multi-Agent System. By instantiating distinct agents (Fact Checker, Recruiter, Researcher) using CrewAI, the system achieves **Cognitive Separation of Concerns**.

- **Tool Use & Environmental Interaction**: Standard LLMs are closed systems. DocMind's agents are open systems. They interact with their environment via the `web_search` and `read_web_page` tools.
- **Iterative Refinement**: The "Senior Engineering Recruiter" agent does not just read the text; it reads the output of the "ATS Scanner" agent first, mimicking human collaborative workflows.

### 8.3 Mitigating Hallucinations via "Link-First" Verification
The most significant theoretical contribution of DocMind is its "Link-First" verification methodology. 
When verifying authenticity, generic agents search the open web, often finding namesakes (people with the same name) and flagging false negatives. DocMind forces the agent to extract the user's *provided* links (LinkedIn, GitHub) from the document and scrape those specific domains first. This creates a grounded verification loop anchored in the user's self-declared digital footprint, drastically reducing hallucinated conflicts.

---

## 9. Comprehensive Deployment Guide

### 9.1 Prerequisites
- Python 3.10 or higher.
- Node.js 18 or higher.
- A Supabase Project (PostgreSQL).
- A Pinecone Index (Dimension: 768 for standard embeddings).
- Google Gemini API Keys.

### 9.2 Environment Configuration
Create a `.env` file in the `backend/` directory:

```bash
# Core AI Intelligence
GOOGLE_API_KEY1=AIzaSyYourKeyHere...
GOOGLE_API_KEY2=AIzaSyOptionalRotationKey...

# Vector Database (RAG)
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENV=us-east-1
PINECONE_INDEX_NAME=docmind-workspace

# Relational Persistence
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
JWT_SECRET=your_jwt_signing_secret

# Optional Configuration
MAX_THREADS=4
DEBUG_MODE=False
```

### 9.3 Backend Setup (Windows / Linux / macOS)
Open a terminal and execute the following:

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI Server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The API documentation will be available at `http://localhost:8000/docs`.

### 9.4 Frontend Setup
Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```
Access the application at `http://localhost:5173`.

---

## 10. Testing & Quality Assurance

### 10.1 Backend Testing (PyTest)
DocMind includes a suite of unit tests for agent logic.
To run the tests:
```bash
pytest backend/tests/
```
Key areas tested:
- **API Key Rotator**: Ensures the system successfully switches to `GOOGLE_API_KEY2` when `GOOGLE_API_KEY1` throws an exception.
- **Tool Mocking**: The `web_search` tool is mocked to return deterministic HTML strings to verify the agent's extraction logic without consuming API quotas.

### 10.2 Frontend Testing (Vitest & React Testing Library)
To run frontend tests:
```bash
npm run test
```
Ensures that the Context API correctly hydrates the UI when switching tabs and that the D3.js physics engine initializes without DOM errors.

---

## 11. Future Roadmap

- **Phase 1 (Current)**: Text and PDF support, 9 Agentic AI features, Supabase Caching.
- **Phase 2 (Q3 2026)**: Introduction of **Vision Agents**. The ability to analyze charts, diagrams, and OCR scanned handwritten documents directly within the PDFs.
- **Phase 3 (Q4 2026)**: **Multi-Document Synthesis**. Allowing the Research Agent to cross-reference multiple uploaded documents simultaneously to find contradictions across a corpus of literature.
- **Phase 4 (2027)**: Fully autonomous enterprise deployments with custom-trained local LLMs (Llama 3 / Mistral) replacing the Gemini dependency for air-gapped security environments.

---

## 👤 Author & Maintainer
**Siddhant**

*Designed and engineered for the era of high-fidelity, verified, and autonomous research. DocMind represents the shift from passive text retrieval to active, agentic intelligence.*
