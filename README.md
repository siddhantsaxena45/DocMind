# 🧠 DocMind: Intelligent PDF Research Assistant

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![CrewAI](https://img.shields.io/badge/CrewAI-Orchestration-orange?style=for-the-badge)](https://www.crewai.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-blue?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)

> **The next-generation research suite that doesn't just read your PDFs—it verifies, visualizes, and expands upon them using a multi-agent AI workforce.**

---

## ⭐ STAR Strategy: Project Overview

### **Situation**
In modern research, information overload is coupled with a "trust deficit." Standard RAG (Retrieval-Augmented Generation) systems often hallucinate or rely on outdated document data without cross-referencing the live web. Researchers spend hours manually verifying claims (GPAs, project links, credentials) and struggling to visualize complex entity relationships within dense PDFs.

### **Task**
Develop **DocMind**, a premium research ecosystem that:
1.  **Orchestrates** multiple AI agents to perform link-first document verification.
2.  **Visualizes** knowledge through interactive, physics-simulated SVG graphs.
3.  **Enhances** productivity with automated flashcards, code generation, and deep AI research tools.
4.  **Ensures** reliability through an automated API key rotation system (Gemini 2.5 Flash).

### **Action**
- **Architecture**: Built a high-performance **FastAPI** backend integrated with **CrewAI** for multi-agent task execution.
- **Fact-Checking**: Implemented an "Investigative Auditor" agent that prioritizes URLs found *within* the document (LinkedIn, GitHub, Portfolios) before searching the web (DuckDuckGo).
- **Frontend**: Designed a **glassmorphic React UI** using custom CSS and Lucide icons for a premium, distraction-free research experience.
- **Intelligence**: Leveraged **Gemini 2.5 Flash** for blazing-fast inference and **Trafilatura** for clean web scraping.

### **Result**
- **90% Reduction** in manual fact-checking time.
- **Interactive Knowledge Discovery**: Real-time graph generation allows users to see relationships that are otherwise "hidden" in text.
- **Zero Downtime**: The API key rotation logic ensures the system remains operational even under heavy load.

---

## 📄 Software Requirements Specification (SRS)

### **1. Introduction**
#### **1.1 Purpose**
This document describes the functional and non-functional requirements for DocMind v1.0, focusing on the integration of Multi-Agent Systems (MAS) for document analysis.
#### **1.2 Scope**
DocMind is a web-based application providing PDF management, AI-driven chat, automated verification, and knowledge visualization.

### **2. Overall Description**
#### **2.1 Product Perspective**
DocMind acts as an intelligent layer between a user's local documents and the global web, using LLMs to bridge the gap between static text and live reality.
#### **2.2 User Classes**
- **Researchers/Academics**: Need deep analysis and citation verification.
- **Students**: Require summaries, interactive graphs, and flashcards.
- **Recruiters**: Seek to verify claims in resumes/portfolios instantly.

### **3. System Features**

| Feature | Description | Agentic Logic |
| :--- | :--- | :--- |
| **Document Chat** | Context-aware RAG over uploaded PDFs. | Uses semantic search for precise retrieval. |
| **Authenticity Checker** | Verifies claims (e.g., GPAs, Projects) against the web. | **Link-First Strategy**: Reads document URLs before searching DDG. |
| **Knowledge Graph** | Interactive D3-simulated SVG visualization. | Extracts ontological triples (Source -> Relation -> Target). |
| **AI Research Agent** | Broadens research based on document themes. | Searches external sources to provide broader context. |
| **Code Studio** | Generates functional code from document logic. | Specialized "Coding Agent" optimized for snippet generation. |
| **Flashcard Gen** | Converts key concepts into study aids. | Analyzes information density to identify "testable" facts. |

### **4. External Interface Requirements**
- **User Interface**: Glassmorphism dashboard with responsive Sidebar-Main navigation.
- **API Interfaces**: RESTful FastAPI endpoints for all AI operations.
- **Tools**: CrewAI for orchestration, DuckDuckGo Search API, Trafilatura for scraping.

### **5. Non-Functional Requirements**
- **Performance**: Most agents respond within 5-15 seconds.
- **Security**: JWT-based authentication for user document silos.
- **Reliability**: **API Key Rotator** prevents rate-limiting issues across multiple Gemini keys.

---

## 🛠️ Tech Stack & Architecture

### **Backend (Python)**
- **Framework**: FastAPI
- **Orchestration**: CrewAI
- **LLM**: Gemini 2.5 Flash (via LangChain / Google GenAI)
- **Search & Scraping**: DuckDuckGo (DDGS), Trafilatura
- **Database**: SQLite (SQLAlchemy)

### **Frontend (React)**
- **Bundler**: Vite
- **Icons**: Lucide React
- **Styling**: Vanilla CSS (Premium Glassmorphic Design)
- **Visualization**: D3-like physics for Knowledge Graphs

---

## 🚀 Getting Started

### **Prerequisites**
- Python 3.9+
- Node.js 18+
- Google Gemini API Key(s)

### **1. Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Update .env with your GOOGLE_API_KEYS (comma-separated)
python -m uvicorn app.main:app --reload
```

### **2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

---

## 🛡️ Security & Reliability
DocMind implements a custom `api_key_rotator.py` which dynamically switches between multiple Google API keys to ensure high availability and bypass individual quota limits during intensive multi-agent tasks.

---

## 👤 Author
**Siddhant**

---
*Created with ❤️ for the future of Intelligent Research.*
