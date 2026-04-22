import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar";
import LoginView from "./components/LoginView";
import ChatView from "./features/Chat/ChatView";
import InsightsView from "./features/DocumentInsights/InsightsView";
import AuthenticityView from "./features/Authenticity/AuthenticityView";
import CodeGenView from "./features/CodeGeneration/CodeGenView";
import ResearchView from "./features/Research/ResearchView";
import ResumeView from "./features/Resume/ResumeView";
import PaperView from "./features/Paper/PaperView";
import GraphView from "./features/KnowledgeGraph/GraphView";
import FlashcardView from "./features/Flashcards/FlashcardView";
import { UploadCloud, Menu, User, LogOut } from "lucide-react";
import { loadAuth, saveAuth, clearAuth, authHeader } from "./auth";

function App() {
  const [currentMode, setCurrentMode] = useState("chat");
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [auth, setAuth] = useState(() => loadAuth());

  useEffect(() => {
    if (auth?.token) loadDocuments(auth);
  }, []);

  const onAuth = (nextAuth) => {
    saveAuth(nextAuth);
    setAuth(nextAuth);
    loadDocuments(nextAuth);
  };

  const logout = () => {
    clearAuth();
    setAuth(null);
    setDocuments([]);
    setActiveDoc(null);
  };

  const loadDocuments = async (a = auth) => {
    try {
      const res = await fetch(`http://localhost:8000/documents/${a.userId}`, {
        headers: { ...authHeader(a.token) },
      });
      const data = await res.json();
      setDocuments(data.documents);
      if (data.documents.length > 0 && !activeDoc) {
        setActiveDoc(data.documents[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("user_id", auth.userId);
    fd.append("file", file);
    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        headers: { ...authHeader(auth.token) },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        await loadDocuments();
        setActiveDoc(data.document_id);
      } else {
        alert("Upload error: " + data.detail);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      const res = await fetch(`http://localhost:8000/documents/${docId}?user_id=${auth.userId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
        if (activeDoc === docId) setActiveDoc(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!auth?.token) return <LoginView onAuth={onAuth} />;

  const getTitle = () => {
    const titles = {
      chat: "Document Chat",
      insights: "Insights Dashboard",
      authenticity: "Authenticity Checker",
      research: "AI Research",
      resume: "Resume Optimizer",
      paper: "Paper Analyzer",
      code: "Code Studio",
      graph: "Knowledge Graph",
      flashcards: "Flashcards"
    };
    return titles[currentMode] || "Dashboard";
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-bg-main selection:bg-brand-primary/20">
      <Sidebar 
        currentMode={currentMode} 
        onSetMode={(mode) => { setCurrentMode(mode); setSidebarOpen(false); }} 
        documents={documents}
        activeDoc={activeDoc}
        onSelectDoc={(id) => { setActiveDoc(id); setSidebarOpen(false); }}
        onDeleteDoc={handleDelete}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div>
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-white leading-tight">{getTitle()}</h2>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium hidden sm:block">Welcome back, {auth.username}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <label className={`cursor-pointer btn-primary px-3 md:px-4 py-2 text-xs md:text-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <UploadCloud className="w-3.5 h-3.5 md:w-4 h-4" />
              <span className="hidden sm:inline">{uploading ? "Uploading..." : "Upload PDF"}</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>

            <div className="h-6 md:h-8 w-px bg-white/10 mx-1 md:mx-2 hidden sm:block" />

            <div className="flex items-center gap-1.5 md:gap-2">
               <button className="p-1.5 md:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors" onClick={logout} title="Sign Out">
                 <LogOut className="w-4 h-4 md:w-5 md:h-5" />
               </button>
               <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-brand-primary to-brand-secondary p-[1px] hidden sm:block">
                 <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                   <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                 </div>
               </div>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 relative m-2 md:m-4 bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden">
          <div className="absolute inset-0 flex flex-col">
            {currentMode === 'chat' && <ChatView documentId={activeDoc} userId={auth.userId} />}
            {currentMode === 'insights' && <InsightsView documentId={activeDoc} userId={auth.userId} />}
            {currentMode === 'authenticity' && <AuthenticityView documentId={activeDoc} userId={auth.userId} />}
            {currentMode === 'code' && <CodeGenView documentId={activeDoc} userId={auth.userId} />}
            {currentMode === 'research' && <ResearchView />}
            {currentMode === 'resume' && <ResumeView documentId={activeDoc} userId={auth.userId} />}
            {currentMode === 'paper' && <PaperView documentId={activeDoc} userId={auth.userId} />}
            {currentMode === 'graph' && <GraphView documentId={activeDoc} userId={auth.userId} />}
            {currentMode === 'flashcards' && <FlashcardView documentId={activeDoc} userId={auth.userId} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;