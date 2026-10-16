import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import LoginView from "./components/LoginView";
import ChatView from "./features/Chat/ChatView";
import ShareModal from "./components/ShareModal";
import UploadModal from "./components/UploadModal";
import SharedChatView from "./components/SharedChatView";
import { loadAuth, saveAuth, clearAuth } from "./auth";
import { api } from "./api";

function App() {
  const [auth, setAuth] = useState(() => loadAuth());
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [sharedRouteToken, setSharedRouteToken] = useState(null);

  // Check URL path for shared links: /share/:token
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/share/")) {
      const token = path.replace("/share/", "").trim();
      if (token) {
        setSharedRouteToken(token);
      }
    }

    const onPopState = () => {
      const p = window.location.pathname;
      if (p.startsWith("/share/")) {
        setSharedRouteToken(p.replace("/share/", "").trim());
      } else {
        setSharedRouteToken(null);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Listen for auth-expired event from API client
  useEffect(() => {
    const handleAuthExpired = () => {
      clearAuth();
      setAuth(null);
    };
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  // Initial load when logged in
  useEffect(() => {
    if (auth?.token && !sharedRouteToken) {
      loadInitialData();
    }
  }, [auth?.token, sharedRouteToken]);

  const loadInitialData = async () => {
    try {
      const [convs, docsData] = await Promise.all([
        api.conversations.list(),
        api.documents.list()
      ]);

      setConversations(convs);
      setDocuments(docsData.documents || []);

      if (convs.length > 0) {
        setActiveConversationId(convs[0].id);
      } else {
        // Automatically create initial New Chat if user has no chats
        const newConv = await api.conversations.create({ title: "New Chat" });
        setConversations([newConv]);
        setActiveConversationId(newConv.id);
      }
    } catch (err) {
      console.error("Failed to load initial workspace data:", err);
    }
  };

  const handleLogin = (newAuth) => {
    saveAuth(newAuth);
    setAuth(newAuth);
  };

  const handleLogout = () => {
    clearAuth();
    setAuth(null);
    setConversations([]);
    setActiveConversationId(null);
    setDocuments([]);
  };

  // Conversation handlers
  const handleCreateConversation = async () => {
    try {
      const newConv = await api.conversations.create({ title: "New Chat" });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
  };

  const handleRenameConversation = async (id, newTitle) => {
    try {
      await api.conversations.update(id, { title: newTitle });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      );
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  };

  const handleDeleteConversation = async (id) => {
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await api.conversations.delete(id);
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        if (activeConversationId === id) {
          if (remaining.length > 0) {
            setActiveConversationId(remaining[0].id);
          } else {
            handleCreateConversation();
          }
        }
        return remaining;
      });
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleUpdateConversation = (id, updates) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  // Document handlers
  const handleUploadSuccess = async (uploadedDocs = [], targetConvId = activeConversationId) => {
    try {
      const docsData = await api.documents.list();
      const allDocs = docsData.documents || [];
      setDocuments(allDocs);

      if (targetConvId && uploadedDocs.length > 0) {
        const newIds = uploadedDocs.map(d => d.id || d.document_id).filter(Boolean);
        const targetConv = conversations.find(c => c.id === targetConvId);
        if (targetConv) {
          const currentIds = targetConv.selected_doc_ids || [];
          const updatedIds = Array.from(new Set([...currentIds, ...newIds]));
          await api.conversations.update(targetConvId, { selected_doc_ids: updatedIds });
          handleUpdateConversation(targetConvId, { selected_doc_ids: updatedIds });
        }
      }
    } catch (err) {
      console.error("Failed to refresh documents:", err);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Delete this document from your knowledge base?")) return;
    try {
      await api.documents.delete(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      // Remove from any active filters
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          selected_doc_ids: (c.selected_doc_ids || []).filter((id) => id !== docId)
        }))
      );
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const handleToggleDocFilter = async (docId, convId = activeConversationId) => {
    const activeConv = conversations.find((c) => c.id === convId);
    if (!activeConv) return;

    const currentSelected = activeConv.selected_doc_ids || [];
    const nextSelected = currentSelected.includes(docId)
      ? currentSelected.filter((id) => id !== docId)
      : [...currentSelected, docId];

    try {
      await api.conversations.update(activeConv.id, { selected_doc_ids: nextSelected });
      handleUpdateConversation(activeConv.id, { selected_doc_ids: nextSelected });
    } catch (err) {
      console.error("Failed to toggle document filter:", err);
    }
  };

  const handleAttachDoc = async (docId, convId = activeConversationId) => {
    const targetConv = conversations.find((c) => c.id === convId);
    if (!targetConv) return;
    const currentSelected = targetConv.selected_doc_ids || [];
    if (currentSelected.includes(docId)) return;
    const nextSelected = [...currentSelected, docId];
    try {
      await api.conversations.update(targetConv.id, { selected_doc_ids: nextSelected });
      handleUpdateConversation(targetConv.id, { selected_doc_ids: nextSelected });
    } catch (err) {
      console.error("Failed to attach document to chat:", err);
    }
  };

  const handleDetachDoc = async (docId, convId = activeConversationId) => {
    const targetConv = conversations.find((c) => c.id === convId);
    if (!targetConv) return;
    const currentSelected = targetConv.selected_doc_ids || [];
    const nextSelected = currentSelected.filter((id) => id !== docId);
    try {
      await api.conversations.update(targetConv.id, { selected_doc_ids: nextSelected });
      handleUpdateConversation(targetConv.id, { selected_doc_ids: nextSelected });
    } catch (err) {
      console.error("Failed to detach document from chat:", err);
    }
  };

  // Public shared conversation view
  if (sharedRouteToken) {
    return (
      <SharedChatView
        shareToken={sharedRouteToken}
        onBackToApp={() => {
          window.history.pushState({}, "", "/");
          setSharedRouteToken(null);
        }}
      />
    );
  }

  // Login view if not authenticated
  if (!auth?.token) {
    return <LoginView onAuth={handleLogin} />;
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-bg-main">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={handleCreateConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        documents={documents}
        selectedDocIds={activeConversation?.selected_doc_ids || []}
        onToggleDocFilter={handleToggleDocFilter}
        onAttachDoc={handleAttachDoc}
        onDetachDoc={handleDetachDoc}
        onDeleteDocument={handleDeleteDocument}
        onOpenUploadModal={() => setUploadModalOpen(true)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={auth}
        onLogout={handleLogout}
      />

      {/* Main Chat View */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <ChatView
          conversation={activeConversation}
          onUpdateConversation={handleUpdateConversation}
          onSidebarToggle={() => setSidebarOpen(true)}
          onOpenShareModal={() => setShareModalOpen(true)}
          onOpenUploadModal={() => setUploadModalOpen(true)}
          documents={documents}
          onAttachDoc={handleAttachDoc}
          onDetachDoc={handleDetachDoc}
        />
      </main>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        conversationId={activeConversation?.id}
        conversationTitle={activeConversation?.title}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        activeConversation={activeConversation}
      />
    </div>
  );
}

export default App;