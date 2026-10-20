import React, { useState, useMemo } from "react";
import {
  Plus, MessageSquare, Trash2, Edit2, Check, X, Search,
  FileText, UploadCloud, ChevronDown, ChevronRight,
  LogOut, User, Sparkles, Database, CheckSquare, Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onDeleteConversation,
  documents,
  selectedDocIds,
  onToggleDocFilter,
  onDeleteDocument,
  onOpenUploadModal,
  sidebarOpen,
  setSidebarOpen,
  user,
  onLogout
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [showDocs, setShowDocs] = useState(true);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  // Group conversations by date (Today, Yesterday, Older)
  const groupedConversations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const groups = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: []
    };

    filteredConversations.forEach(conv => {
      const convDate = new Date(conv.updated_at || conv.created_at || Date.now());
      if (convDate >= today) {
        groups.Today.push(conv);
      } else if (convDate >= yesterday) {
        groups.Yesterday.push(conv);
      } else if (convDate >= sevenDaysAgo) {
        groups["Previous 7 Days"].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  }, [filteredConversations]);

  const startRename = (e, conv) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (e, convId) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(convId, editTitle.trim());
    }
    setEditingConvId(null);
  };

  const cancelRename = (e) => {
    e.stopPropagation();
    setEditingConvId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        className={`fixed inset-y-0 left-0 z-50 w-76 md:w-80 h-full bg-slate-950 border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 overflow-hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header & New Chat button */}
        <div className="p-3.5 space-y-3 shrink-0 border-b border-white/5">
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight text-base">DocMind</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onCreateConversation();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 text-white font-medium text-xs md:text-sm transition-all group shadow-sm active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-brand-primary group-hover:scale-110 transition-transform" />
              <span>New Conversation</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono hidden md:inline">Ctrl+K</span>
          </button>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-brand-primary/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Center: Chat History & Documents */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 custom-scrollbar min-h-0">
          {/* Chat History Grouped */}
          <div className="space-y-3">
            {Object.entries(groupedConversations).map(([groupTitle, convs]) => {
              if (convs.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {groupTitle}
                  </div>
                  {convs.map((conv) => {
                    const isActive = conv.id === activeConversationId;
                    const isEditing = editingConvId === conv.id;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          onSelectConversation(conv.id);
                          setSidebarOpen(false);
                        }}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                          isActive
                            ? "bg-white/10 text-white font-medium shadow-xs"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-1">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-brand-primary" : "text-slate-500"}`} />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveRename(e, conv.id);
                                if (e.key === "Escape") cancelRename(e);
                              }}
                              autoFocus
                              className="bg-slate-900 border border-brand-primary/50 text-white rounded px-1.5 py-0.5 text-xs w-full outline-none"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="truncate">{conv.title}</span>
                              {conv.selected_doc_ids && conv.selected_doc_ids.length > 0 && (
                                <span
                                  className="text-[10px] bg-brand-primary/20 text-brand-primary px-1.5 py-0.2 rounded-md font-mono shrink-0 flex items-center gap-0.5 border border-brand-primary/30"
                                  title={`${conv.selected_doc_ids.length} document(s) in this chat's knowledge base`}
                                >
                                  <FileText className="w-2.5 h-2.5" />
                                  <span>{conv.selected_doc_ids.length}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isEditing ? (
                            <>
                              <button
                                onClick={(e) => saveRename(e, conv.id)}
                                className="p-1 text-emerald-400 hover:bg-white/10 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelRename}
                                className="p-1 text-slate-400 hover:bg-white/10 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                              <button
                                onClick={(e) => startRename(e, conv)}
                                className="p-1 hover:text-white text-slate-500 hover:bg-white/10 rounded"
                                title="Rename"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteConversation(conv.id);
                                }}
                                className="p-1 hover:text-red-400 text-slate-500 hover:bg-white/10 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {conversations.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-600">
                No conversations yet. Click "New Conversation" to begin.
              </div>
            )}
          </div>

          {/* Knowledge Base / Document Library Section */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between px-2">
              <button
                onClick={() => setShowDocs(!showDocs)}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
              >
                {showDocs ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <Database className="w-3.5 h-3.5 text-brand-secondary" />
                <span>Document Library</span>
                <span className="text-[10px] bg-white/10 text-slate-400 px-1.5 py-0.2 rounded-full font-mono">
                  {documents.length}
                </span>
              </button>

              <button
                onClick={onOpenUploadModal}
                className="p-1 hover:bg-white/10 text-brand-secondary rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                title="Upload document"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>

            <div className="px-2 text-[10px] text-slate-500">
              Check files to attach to active chat:
            </div>

            {showDocs && (
              <div className="space-y-1 pl-1">
                {documents.map((doc) => {
                  const isAttached = selectedDocIds.includes(doc.id);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => onToggleDocFilter(doc.id)}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
                        isAttached
                          ? "bg-brand-primary/15 border border-brand-primary/40 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-300 border border-transparent"
                      }`}
                      title={isAttached ? "Attached to current chat (click to detach)" : "Click to attach to current chat"}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleDocFilter(doc.id);
                          }}
                          className="shrink-0 text-slate-500 hover:text-brand-primary"
                        >
                          {isAttached ? (
                            <CheckSquare className="w-3.5 h-3.5 text-brand-primary" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <FileText className="w-3.5 h-3.5 shrink-0 text-brand-secondary" />
                        <span className="truncate text-[11px]">{doc.filename}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isAttached && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-medium">
                            in chat
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500 font-mono">
                          {doc.chunk_count}c
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDocument(doc.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 transition-opacity"
                          title="Delete file permanently"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {documents.length === 0 && (
                  <div
                    onClick={onOpenUploadModal}
                    className="p-3 border border-dashed border-white/10 rounded-xl text-center text-[11px] text-slate-500 cursor-pointer hover:border-brand-primary/40 hover:text-slate-300 transition-colors"
                  >
                    No documents yet. Click to upload PDF, DOCX, TXT, etc.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom User Profile & Logout */}
        <div className="p-3 border-t border-white/5 shrink-0 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
              {user?.username ? user.username[0] : "U"}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">{user?.username}</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Session
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
