import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import LoginView from "./components/LoginView";
import ChatView from "./features/Chat/ChatView";
import InsightsView from "./features/DocumentInsights/InsightsView";
import AuthenticityView from "./features/Authenticity/AuthenticityView";
import ImageGenView from "./features/ImageGeneration/ImageGenView";
import CodeGenView from "./features/CodeGeneration/CodeGenView";
import ResearchView from "./features/Research/ResearchView";
import GraphView from "./features/KnowledgeGraph/GraphView";
import FlashcardView from "./features/Flashcards/FlashcardView";
import { UploadCloud, Layers, Menu, X } from "lucide-react";
import { loadAuth, saveAuth, clearAuth, authHeader } from "./auth";

function App() {
  const [currentMode, setCurrentMode] = useState("chat");
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [auth, setAuth] = useState(() => loadAuth()); // {token,userId,username}

  useEffect(() => {
    if (auth?.token) loadDocuments(auth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      e.target.value = null; // reset
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-dark text-slate-200">
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
      
      <main className="flex-1 flex flex-col min-w-0 relative w-full">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border-dark bg-bg-panel/50 backdrop-blur shrink-0 z-20">
           <div className="flex items-center gap-3">
             <button 
               className="md:hidden glass-button p-2 flex items-center justify-center rounded-lg"
               onClick={() => setSidebarOpen(true)}
             >
               <Menu className="w-5 h-5 text-slate-300" />
             </button>
             <div className="font-semibold text-lg text-slate-100 opacity-90 tracking-wide truncate">
               {currentMode === 'chat' && "Document Chat"}
               {currentMode === 'insights' && "Insights Dashboard"}
               {currentMode === 'authenticity' && "Authenticity Checker"}
               {currentMode === 'research' && "AI Research"}
               {currentMode === 'image' && "Image Generation"}
               {currentMode === 'code' && "Code Studio"}
               {currentMode === 'graph' && "Knowledge Graph"}
               {currentMode === 'flashcards' && "Flashcards"}
             </div>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="text-xs text-slate-400 hidden sm:block">
               Signed in as <span className="text-slate-200 font-medium">{auth.username}</span>
             </div>
             <button className="glass-button px-3 py-2 rounded-lg text-sm" onClick={logout}>
               Sign out
             </button>
             <label className={`cursor-pointer primary-button px-3 sm:px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
               <UploadCloud className="w-4 h-4" />
               <span className="hidden sm:inline">{uploading ? "Uploading..." : "Upload PDF"}</span>
               <span className="sm:hidden">{uploading ? "..." : "Upload"}</span>
               <input 
                 type="file" 
                 accept="application/pdf" 
                 className="hidden" 
                 onChange={handleFileUpload}
                 disabled={uploading}
               />
             </label>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto relative z-10 w-full h-full scroll-smooth">
           {currentMode === 'chat' && <ChatView documentId={activeDoc} userId={auth.userId} />}
           {currentMode === 'insights' && <InsightsView documentId={activeDoc} userId={auth.userId} />}
           {currentMode === 'authenticity' && <AuthenticityView documentId={activeDoc} userId={auth.userId} />}
           {currentMode === 'image' && <ImageGenView />}
           {currentMode === 'code' && <CodeGenView documentId={activeDoc} userId={auth.userId} />}
           {currentMode === 'research' && <ResearchView />}
           {currentMode === 'graph' && <GraphView documentId={activeDoc} userId={auth.userId} />}
           {currentMode === 'flashcards' && <FlashcardView documentId={activeDoc} userId={auth.userId} />}
        </div>
      </main>
    </div>
  );
}

export default App;