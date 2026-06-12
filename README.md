# 🧠 DocMind: Multi-Agent AI Research & Verification Ecosystem

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

**DocMind** is an advanced, production-grade application that goes beyond standard Retrieval-Augmented Generation (RAG). It leverages a powerful Multi-Agent System (powered by CrewAI) to act as an autonomous AI workforce that audits, visualizes, and expands upon your documents with surgical precision.

---

## ✨ Key Features & Capabilities

*   **🕵️ Authenticity Auditor (Link-First Verification)**
    *   Extracts external links (GitHub, LinkedIn, portfolios) directly from uploaded documents (like resumes).
    *   Physically scrapes those specific web pages and cross-references them against claims made in the text.
*   **🕸️ Knowledge Graph Studio**
    *   Extracts deep ontological relationships from the document's core concepts.
    *   Generates interactive, physics-based 2D network graphs using `react-force-graph-2d`.
*   **👔 ATS & Recruiter Pipeline**
    *   Analyzes resumes against specific Job Descriptions.
    *   Uses a dual-agent workflow where an ATS Agent scores the document, and a Recruiter Agent rewrites weak bullet points using the STAR method.
*   **🔬 Scientific Paper Analyzer**
    *   Deconstructs dense academic literature into standardized components: Hypothesis, Methodology, Datasets, Limitations, and Future Scope.
*   **🌐 Advanced Research Synthesis**
    *   Performs multi-hop web searches independent of the uploaded document to expand on queries, providing up-to-date real-world context.
*   **🛡️ Resilient Agentic Infrastructure**
    *   **API Key Rotation:** Automatically cycles through multiple LLM keys upon rate-limiting (`429` errors).
    *   **Isolated Vector Namespaces:** Uses Pinecone to ensure that each document is isolated to prevent cross-contamination.
    *   **Database Caching:** Heavily utilizes PostgreSQL `JSONB` via Supabase to cache expensive agent outputs.

---

## 🛠️ Technology Stack

### Frontend (React Ecosystem)
*   **Core:** React 19, Vite (for lightning-fast builds)
*   **Styling & UI:** Tailwind CSS v4, Framer Motion (micro-animations & glassmorphism), Lucide React (icons)
*   **Data Visualization:** React Force Graph 2D
*   **Markdown Rendering:** React Markdown & React Syntax Highlighter

### Backend (Python/AI Ecosystem)
*   **Core Server:** FastAPI & Uvicorn
*   **AI & Agents:** CrewAI, LangChain, Google GenAI
*   **Vector Database:** Pinecone (Cosine Metric, 768 Dimensions)
*   **Relational Database:** PostgreSQL (hosted on Supabase, using `psycopg2-binary`)
*   **Web Scraping & Search:** DuckDuckGo Search (`ddgs`), Trafilatura
*   **Document Processing:** PyPDF, RecursiveCharacterTextSplitter

---

## 🚀 Getting Started

Follow these steps to run DocMind locally. 

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   A Pinecone Account & Index
*   A Supabase Project (PostgreSQL)

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt
```

#### Environment Variables
Create a `.env` file in the `backend/` directory with the following structure:

```env
# Google Gemini API Keys (Add multiple for automatic failover/rotation)
GOOGLE_API_KEY1="your_gemini_key_1"
GOOGLE_API_KEY2="your_gemini_key_2"

# Supabase (PostgreSQL)
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
SUPABASE_URL="https://[YOUR_PROJECT].supabase.co"
SUPABASE_KEY="your_supabase_anon_key"

# Pinecone (Vector DB)
PINECONE_API_KEY="your_pinecone_api_key"
PINECONE_INDEX_NAME="chatbot"

# CORS Configuration
CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
```

#### Run the Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*The interactive Swagger API documentation will be available at `http://localhost:8000/docs`.*

### 2. Frontend Setup

Open a **new** terminal and navigate to the `frontend` directory:

```bash
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```
*Access the beautiful application interface at `http://localhost:5173`.*

---

## 🏗️ System Architecture Flow

1.  **Ingestion:** The frontend sends a PDF to the FastAPI gateway.
2.  **Processing:** Text is chunked, vectorized using LangChain, and stored in an isolated Pinecone namespace.
3.  **Agentic Routing:** Based on the user's requested tool (e.g., Authenticity Auditor or ATS pipeline), the request is handed to CrewAI.
4.  **Investigation:** The designated Agent acts, potentially utilizing web-scraping tools or specific vector DB lookups.
5.  **Caching:** The structured JSON output from the agents is permanently saved into Supabase to optimize future requests.
6.  **Delivery:** The response is returned and dynamically visualized (via Framer Motion & Force Graphs) on the React frontend.

---

*Designed and engineered for high-fidelity, autonomous research.*
