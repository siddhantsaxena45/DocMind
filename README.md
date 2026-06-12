# 🧠 DocMind

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

**DocMind** is an advanced, production-grade application that leverages Retrieval-Augmented Generation (RAG) and a powerful Multi-Agent System. It acts as an autonomous AI workforce that analyzes, visualizes, and expands upon your documents with precision.

---

## ✨ Key Features & AI Capabilities

DocMind implements a suite of specialized AI tools designed to handle diverse document processing needs:

*   **🕵️ Document Authenticity Auditor:** Verifies claims and checks the authenticity of documents by extracting external links and cross-referencing information.
*   **🕸️ Knowledge Graph Studio:** Extracts relationships from documents and generates interactive 2D network graphs.
*   **👔 ATS & Resume Agent:** Analyzes resumes, scores them against job descriptions, and provides targeted feedback to improve candidacy.
*   **🔬 Scientific Paper Analyzer:** Deconstructs complex academic literature into easily digestible formats.
*   **🌐 Research Agent:** Performs multi-hop web searches to expand upon document context using real-world data.
*   **🛡️ Source Credibility Checker:** Evaluates the credibility and reliability of sources mentioned in your texts.
*   **📚 Flashcard Generator & Summarizer:** Automatically generates study materials, flashcards, and concise summaries from extensive documents.
*   **💻 Code Generation:** Assists in generating and understanding code snippets found within technical documents.

---

## 🛠️ Technology Stack

### Frontend
*   **Core:** React 19, Vite
*   **Styling & UI:** Tailwind CSS v4, Framer Motion, Lucide React
*   **Data Visualization:** React Force Graph 2D
*   **Markdown Support:** React Markdown, React Syntax Highlighter

### Backend
*   **Core Framework:** FastAPI & Uvicorn
*   **AI & Agents:** LangChain ecosystem (Google GenAI, Pinecone), CrewAI
*   **Vector Database:** Pinecone
*   **Database & ORM:** PostgreSQL (`psycopg2-binary`)
*   **Authentication:** PyJWT, Passlib
*   **Web Scraping & Search:** DuckDuckGo Search (`ddgs`), Trafilatura
*   **Document Processing:** PyPDF

---

## 📁 Project Structure

```text
DocMind/
├── backend/                  # Python FastAPI application
│   ├── app/
│   │   ├── ai_features/      # Specialized AI agents (Resume, Knowledge Graph, etc.)
│   │   ├── api/              # API Route definitions (Auth, Upload, Query, AI Tools)
│   │   ├── core/             # Configuration and Database setup
│   │   ├── services/         # Core business logic and LLM integrations
│   │   └── main.py           # FastAPI application entry point
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables for backend
└── frontend/                 # React frontend application
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── features/         # Feature-specific modules
    │   ├── App.jsx           # Main React component
    │   └── index.css         # Tailwind and global styles
    ├── package.json          # Node dependencies
    └── vite.config.js        # Vite bundler configuration
```

---

## 🚀 Getting Started

Follow these steps to run DocMind locally.

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   Pinecone Account & Index
*   PostgreSQL Database (e.g., Supabase, Neon, or local)
*   Google Gemini API Key

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Environment Variables
Create a `.env` file in the `backend/` directory:

```env
# Database configuration
DATABASE_URL="postgresql://user:password@localhost/dbname"

# AI & Vector DB
GOOGLE_API_KEY="your_gemini_api_key"
PINECONE_API_KEY="your_pinecone_api_key"
PINECONE_INDEX_NAME="docmind-index"

# Security
SECRET_KEY="your_jwt_secret_key"
CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
```

#### Run the Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API documentation will be available at `http://localhost:8000/docs`.*

### 2. Frontend Setup

Open a **new** terminal and navigate to the `frontend` directory:

```bash
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```
*Access the application interface at `http://localhost:5173`.*

---

*Engineered for comprehensive document understanding and verification.*
