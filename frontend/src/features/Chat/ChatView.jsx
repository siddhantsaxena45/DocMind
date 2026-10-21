import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Send, Bot, User, Loader2, Sparkles, Quote, Globe, Share2,
  Copy, Check, RotateCcw, Menu, ExternalLink, ChevronDown,
  Paperclip, ArrowUp, AlertCircle, FileText, Database, Plus, X,
  Search, Shield, CheckCircle2, Trash2,
  Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../api";
import { loadAuth } from "../../auth";
import MarkdownTableRenderer from "./MarkdownTableRenderer";
import ResearchStatusBar from "./ResearchStatusBar";
import SourceCardsCarousel from "./SourceCardsCarousel";
import FollowupQuestions from "./FollowupQuestions";
import AllSourcesModal from "./AllSourcesModal";

const PROMPT_SUGGESTIONS = [
  "Summarize the key findings, methodologies, and conclusions",
  "Compare document claims with verified real-time web facts",
  "Extract important numerical metrics into a structured table",
  "Highlight any potential risks, liabilities, or unanswered questions"
];

const getFileIconColor = (filename = "") => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "pdf": return "text-red-400";
    case "docx":
    case "doc": return "text-blue-400";
    case "xlsx":
    case "xls":
    case "csv": return "text-emerald-400";
    case "pptx":
    case "ppt": return "text-orange-400";
    case "png":
    case "jpg":
    case "jpeg":
    case "webp": return "text-purple-400";
    default: return "text-cyan-400";
  }
};

export default function ChatView({
  conversation,
  onUpdateConversation,
  onSidebarToggle,
  onOpenShareModal,
  onOpenUploadModal,
  documents = [],
  onAttachDoc,
  onDetachDoc
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState(null);
  const [error, setError] = useState(null);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [activeSourcesModal, setActiveSourcesModal] = useState(null);
  const [editingMsgIdx, setEditingMsgIdx] = useState(null);
  const [editContent, setEditContent] = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Derive attached vs unattached documents for this active conversation
  const selectedDocIds = useMemo(() => {
    return conversation?.selected_doc_ids || [];
  }, [conversation?.selected_doc_ids]);

  const attachedDocs = useMemo(() => {
    return documents.filter((d) => selectedDocIds.includes(d.id));
  }, [documents, selectedDocIds]);

  const unattachedDocs = useMemo(() => {
    const list = documents.filter((d) => !selectedDocIds.includes(d.id));
    if (!docSearchQuery.trim()) return list;
    const q = docSearchQuery.toLowerCase();
    return list.filter((d) => d.filename.toLowerCase().includes(q));
  }, [documents, selectedDocIds, docSearchQuery]);

  // Auto-scroll to bottom
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages, streaming]);

  // Load conversation details & message history
  useEffect(() => {
    if (!conversation?.id) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.conversations.get(conversation.id);
        setMessages(data.messages || []);
      } catch (err) {
        setError(err.message || "Failed to load chat history");
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [conversation?.id]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startStream = async (textToSend, { isRetry = false } = {}) => {
    if (!textToSend || !conversation?.id) return;
    setStreaming(true);
    setError(null);

    const auth = loadAuth();
    const token = auth?.token;

    // Construct stream URL
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const selectedDocsQuery = (conversation.selected_doc_ids || []).join(",");
    const url = new URL(`${baseUrl}/api/conversations/${conversation.id}/messages/stream`);
    url.searchParams.set("text", textToSend);
    url.searchParams.set("token", token || "");
    url.searchParams.set("web_search", String(conversation.web_search_enabled));
    if (isRetry) {
      url.searchParams.set("retry", "true");
    }
    if (selectedDocsQuery) {
      url.searchParams.set("selected_docs", selectedDocsQuery);
    } else {
      url.searchParams.set("selected_docs", "");
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url.toString(), {
        signal: abortControllerRef.current.signal,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Streaming failed: HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let currentEvent = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("event:")) {
            currentEvent = trimmed.replace("event:", "").trim();
          } else if (trimmed.startsWith("data:")) {
            const rawData = trimmed.replace("data:", "").trim();
            if (!rawData) continue;

            try {
              const parsed = JSON.parse(rawData);

              if (currentEvent === "title" && parsed.title) {
                onUpdateConversation(conversation.id, { title: parsed.title });
              } else if (currentEvent === "research") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      research_query: parsed.query,
                      research_status: parsed.status,
                      sources_count: parsed.sources_count
                    };
                  }
                  return updated;
                });
              } else if (currentEvent === "citations") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = { ...updated[lastIdx], sources: parsed };
                  }
                  return updated;
                });
              } else if (currentEvent === "chunk" && parsed.chunk) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: (updated[lastIdx].content || "") + parsed.chunk
                    };
                  }
                  return updated;
                });
              } else if (currentEvent === "related") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      related_questions: Array.isArray(parsed) ? parsed : []
                    };
                  }
                  return updated;
                });
              } else if (currentEvent === "done" && parsed.message_id) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      id: parsed.message_id,
                      sources: parsed.sources || updated[lastIdx].sources,
                      related_questions: parsed.related_questions || updated[lastIdx].related_questions || [],
                      research_query: parsed.research_query || updated[lastIdx].research_query
                    };
                  }
                  return updated;
                });
              } else if (currentEvent === "error") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: parsed.error ? `⚠️ **Error:** ${parsed.error}` : "⚠️ An error occurred while generating the response. Please try again."
                    };
                  }
                  return updated;
                });
              }
            } catch (parseErr) {
              // Ignore non-json lines
            }
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Stream stopped by user");
      } else {
        console.error("Stream error, falling back to standard API:", err);
        try {
          let fallbackRes;
          if (isRetry) {
            fallbackRes = await api.conversations.regenerate(conversation.id);
          } else {
            fallbackRes = await api.conversations.sendMessage(conversation.id, {
              text: textToSend,
              web_search: conversation.web_search_enabled,
              selected_doc_ids: conversation.selected_doc_ids || []
            });
          }

          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
              updated[lastIdx] = {
                id: fallbackRes.message_id,
                role: "assistant",
                content: fallbackRes.answer,
                sources: fallbackRes.sources,
                related_questions: fallbackRes.related_questions || [],
                research_query: fallbackRes.research_query,
                created_at: new Date().toISOString()
              };
            }
            return updated;
          });
        } catch (postErr) {
          setError(postErr.message || "Failed to generate AI response.");
        }
      }
    } finally {
      setStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSend = async (customPrompt = null) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || !conversation?.id || streaming) return;

    setInput("");
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // 1. Optimistically append user message
    const userMsg = {
      id: `tmp_${Date.now()}`,
      role: "user",
      content: textToSend,
      sources: [],
      created_at: new Date().toISOString()
    };

    // 2. Prepare streaming assistant placeholder
    const assistantMsgPlaceholder = {
      id: `ai_${Date.now()}`,
      role: "assistant",
      content: "",
      sources: [],
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg, assistantMsgPlaceholder]);
    await startStream(textToSend, { isRetry: false });
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRegenerate = async () => {
    if (streaming || !conversation?.id) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    setError(null);

    // Immediately replace last assistant message with an active thinking placeholder
    setMessages((prev) => {
      const withoutLastAi = prev.filter((m, i) => !(i === prev.length - 1 && m.role === "assistant"));
      return [
        ...withoutLastAi,
        {
          id: `ai_${Date.now()}`,
          role: "assistant",
          content: "",
          sources: [],
          research_query: lastUserMsg.content.slice(0, 40),
          created_at: new Date().toISOString()
        }
      ];
    });

    await startStream(lastUserMsg.content, { isRetry: true });
  };

  const handleSaveEdit = async (msgIdx, newText) => {
    const trimmed = newText.trim();
    if (!trimmed || streaming || !conversation?.id) return;
    setEditingMsgIdx(null);

    // If text didn't change, do nothing
    if (trimmed === messages[msgIdx]?.content) return;

    setError(null);

    // Truncate messages after this edited message and attach a new streaming assistant placeholder
    setMessages((prev) => {
      const truncated = prev.slice(0, msgIdx + 1);
      truncated[msgIdx] = {
        ...truncated[msgIdx],
        content: trimmed
      };
      return [
        ...truncated,
        {
          id: `ai_${Date.now()}`,
          role: "assistant",
          content: "",
          sources: [],
          research_query: trimmed.slice(0, 40),
          created_at: new Date().toISOString()
        }
      ];
    });

    await startStream(trimmed, { isRetry: true });
  };

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  };

  const toggleWebSearch = async () => {
    if (!conversation) return;
    const nextVal = !conversation.web_search_enabled;
    try {
      await api.conversations.update(conversation.id, { web_search_enabled: nextVal });
      onUpdateConversation(conversation.id, { web_search_enabled: nextVal });
    } catch (err) {
      console.error("Failed to update web search:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/60 relative overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 md:h-16 border-b border-white/5 flex items-center justify-between px-3 md:px-6 bg-slate-950/40 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-2 md:gap-3 truncate">
          <button
            onClick={onSidebarToggle}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="truncate">
            <h2 className="text-sm md:text-base font-bold text-white tracking-tight truncate">
              {conversation?.title || "New Chat"}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
              <span className={attachedDocs.length > 0 ? "text-brand-primary font-semibold" : "text-slate-500"}>
                {attachedDocs.length > 0
                  ? `${attachedDocs.length} ${attachedDocs.length === 1 ? "file" : "files"} in this chat's knowledge base`
                  : "No documents attached"}
              </span>
              <span>•</span>
              <span className={conversation?.web_search_enabled ? "text-cyan-400" : "text-slate-500"}>
                Web Search {conversation?.web_search_enabled ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Chat Knowledge Base Button */}
          <button
            onClick={() => setShowKnowledgeModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              attachedDocs.length > 0
                ? "bg-brand-primary/15 border-brand-primary/40 text-brand-primary hover:bg-brand-primary/25 shadow-xs shadow-brand-primary/20"
                : "bg-white/5 border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40"
            }`}
            title="Configure documents accessible by this chat"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {attachedDocs.length > 0 ? `${attachedDocs.length} Docs in Chat` : "Attach Docs"}
            </span>
            <span className="sm:hidden">
              {attachedDocs.length > 0 ? `${attachedDocs.length} Docs` : "Attach"}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Web Search Toggle Pill */}
          <button
            onClick={toggleWebSearch}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              conversation?.web_search_enabled
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 shadow-xs shadow-cyan-500/20"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle live Web Search"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Web Search</span>
            <span className={`w-1.5 h-1.5 rounded-full ${conversation?.web_search_enabled ? "bg-cyan-400" : "bg-slate-600"}`} />
          </button>

          {/* Share Button */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
            title="Share chat link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </header>

      {/* Message List / Empty State */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:p-8 space-y-6 custom-scrollbar min-h-0">
        {error && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span className="truncate">{error}</span>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={streaming}
              className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-medium flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="max-w-2xl mx-auto py-8 md:py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-xl shadow-brand-primary/20 mb-5">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
              DocMind AI Research Assistant
            </h3>
            <p className="text-slate-400 text-xs md:text-sm max-w-md leading-relaxed mb-6">
              Ask deep questions about your attached files with page-accurate citations and live web synthesis.
            </p>

            {/* Chat Scope Status Card */}
            <div className="w-full mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    This Chat's Personal Knowledge Base
                  </span>
                </div>
                <button
                  onClick={() => setShowKnowledgeModal(true)}
                  className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Manage Files
                </button>
              </div>

              {attachedDocs.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">
                    DocMind is currently grounded strictly in the following <span className="font-semibold text-brand-primary">{attachedDocs.length}</span> file(s):
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachedDocs.map((doc) => (
                      <span
                        key={doc.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-brand-primary/30 text-white text-xs font-medium"
                      >
                        <FileText className={`w-3.5 h-3.5 ${getFileIconColor(doc.filename)}`} />
                        <span className="truncate max-w-[200px]">{doc.filename}</span>
                        <button
                          onClick={() => onDetachDoc(doc.id)}
                          className="text-slate-400 hover:text-red-400 ml-1 transition-colors"
                          title="Detach file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-dashed border-white/15">
                  <div className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">No documents attached yet. </span>
                    Attach or upload files to give this chat its own private knowledge base.
                  </div>
                  <button
                    onClick={() => setShowKnowledgeModal(true)}
                    className="btn-primary text-xs px-3.5 py-1.5 shrink-0 flex items-center gap-1.5 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Attach Files</span>
                  </button>
                </div>
              )}
            </div>

            {/* Prompt Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(suggestion)}
                  className="text-left p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-xs text-slate-300 hover:text-white transition-all group"
                >
                  <p className="line-clamp-2 leading-relaxed">{suggestion}</p>
                  <span className="text-[10px] text-brand-primary mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                    Ask now →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const isLastMessage = idx === messages.length - 1;

            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 md:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] md:max-w-[82%] rounded-2xl p-4 md:p-5 text-xs md:text-sm leading-relaxed ${
                    isUser
                      ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                      : "bg-slate-800/60 border border-white/5 text-slate-200"
                  }`}
                >
                  {isUser ? (
                    editingMsgIdx === idx ? (
                      <div className="space-y-2.5 w-full min-w-[280px] sm:min-w-[420px]">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit(idx, editContent);
                            } else if (e.key === "Escape") {
                              setEditingMsgIdx(null);
                            }
                          }}
                          rows={Math.max(2, Math.min(8, editContent.split("\n").length + 1))}
                          className="w-full bg-slate-900/90 border border-white/20 focus:border-white/50 rounded-xl p-3 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none resize-none transition-all shadow-inner"
                          placeholder="Edit your message..."
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => setEditingMsgIdx(null)}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(idx, editContent)}
                            disabled={!editContent.trim() || streaming}
                            className="px-3.5 py-1.5 rounded-lg bg-white text-slate-950 font-medium hover:bg-slate-100 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                          >
                            Save & Submit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative">
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {!streaming && (
                          <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-end gap-1.5 text-white/80 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingMsgIdx(idx);
                                setEditContent(msg.content);
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/20 text-[11px] font-medium transition-colors"
                              title="Edit message"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleCopyMessage(msg.content, idx)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/20 text-[11px] font-medium transition-colors"
                              title="Copy prompt"
                            >
                              {copiedMsgIdx === idx ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-300" />
                                  <span className="text-emerald-300">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      {/* 1. Research Status Header (Perplexity Collapsible Accordion with Stacked Favicons) */}
                      {(msg.research_query || (msg.sources && msg.sources.length > 0)) && (
                        <ResearchStatusBar
                          researchQuery={msg.research_query}
                          sources={msg.sources || []}
                          onOpenAllSources={() =>
                            setActiveSourcesModal({
                              sources: msg.sources || [],
                              researchQuery: msg.research_query
                            })
                          }
                        />
                      )}

                      {/* 2. Main Markdown Content or Animated Thinking Loader */}
                      {msg.content ? (
                        <MarkdownTableRenderer
                          content={msg.content}
                          messageIdx={idx}
                        />
                      ) : streaming && isLastMessage ? (
                        <div className="flex items-center gap-3 py-3 px-1 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0ms]" />
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:150ms]" />
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:300ms]" />
                          </div>
                          <span className="text-xs text-slate-300 font-medium tracking-wide">
                            {msg.research_query
                              ? `Researching ${msg.research_query}...`
                              : conversation?.web_search_enabled
                              ? "Searching the web & synthesizing..."
                              : "Thinking..."}
                          </span>
                        </div>
                      ) : null}

                      {/* 3. Source Cards Carousel (Perplexity Style Cards Grid) */}
                      {msg.sources && msg.sources.length > 0 && (
                        <SourceCardsCarousel
                          sources={msg.sources}
                          researchQuery={msg.research_query}
                          onOpenAllSources={() =>
                            setActiveSourcesModal({
                              sources: msg.sources,
                              researchQuery: msg.research_query
                            })
                          }
                        />
                      )}

                      {/* 4. Follow-up / Related Questions (↳ Pills) */}
                      {msg.related_questions && msg.related_questions.length > 0 && !streaming && (
                        <FollowupQuestions
                          questions={msg.related_questions}
                          onSelectQuestion={(q) => handleSend(q)}
                          disabled={streaming}
                        />
                      )}

                      {/* 5. Modern Action Toolbar (Copy, Try again) - ONLY rendered AFTER message is generated */}
                      {!streaming && msg.content && (
                        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyMessage(msg.content, idx)}
                              className="flex items-center gap-1.5 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/5 text-slate-400"
                              title="Copy response"
                            >
                              {copiedMsgIdx === idx ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-[11px] text-emerald-400 font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span className="text-[11px]">Copy</span>
                                </>
                              )}
                            </button>

                            {isLastMessage && (
                              <button
                                onClick={handleRegenerate}
                                className="flex items-center gap-1.5 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/5 text-slate-400"
                                title="Regenerate answer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Try again</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                  </div>
                )}
              </motion.div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="p-3 md:p-6 bg-slate-950/70 backdrop-blur-md border-t border-white/5 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          {/* Active Chat Knowledge Base Chips Bar */}
          {attachedDocs.length > 0 ? (
            <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
                <Database className="w-3 h-3 text-brand-primary" />
                Chat Knowledge Base:
              </span>
              {attachedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-brand-primary/30 text-white text-[11px] shrink-0 shadow-xs"
                >
                  <FileText className={`w-3 h-3 ${getFileIconColor(doc.filename)}`} />
                  <span className="max-w-[150px] truncate">{doc.filename}</span>
                  <button
                    onClick={() => onDetachDoc(doc.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors ml-0.5"
                    title={`Detach ${doc.filename} from this chat`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setShowKnowledgeModal(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] shrink-0 transition-colors"
                title="Add more documents to this chat"
              >
                <Plus className="w-3 h-3 text-brand-primary" />
                <span>Add Doc</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2 mb-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-slate-600" />
                <span>No documents attached to this chat.</span>
              </div>
              <button
                onClick={() => setShowKnowledgeModal(true)}
                className="text-brand-primary hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Attach / Upload to Chat
              </button>
            </div>
          )}

          {/* Textarea Container */}
          <div className="relative rounded-2xl bg-slate-900 border border-white/10 shadow-xl focus-within:border-brand-primary/50 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                attachedDocs.length > 0
                  ? `Ask anything about ${attachedDocs.length === 1 ? attachedDocs[0].filename : `${attachedDocs.length} attached documents`}...`
                  : "Ask anything, search the web, or attach documents to this chat..."
              }
              className="w-full bg-transparent pl-4 pr-24 py-3.5 text-xs md:text-sm text-white placeholder-slate-500 outline-none resize-none max-h-48 custom-scrollbar"
            />

            {/* Action buttons inside input */}
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
              {/* Web Search icon button */}
              <button
                type="button"
                onClick={toggleWebSearch}
                className={`p-2 rounded-xl transition-colors ${
                  conversation?.web_search_enabled
                    ? "text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
                title={`Web Search is ${conversation?.web_search_enabled ? "ON" : "OFF"}`}
              >
                <Globe className="w-4 h-4" />
              </button>

              {/* Attach / Upload file icon button */}
              <button
                type="button"
                onClick={() => setShowKnowledgeModal(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                title="Manage chat attached documents"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Send or Stop button */}
              {streaming ? (
                <button
                  type="button"
                  onClick={handleStopStream}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md transition-all active:scale-95"
                  title="Stop generating"
                >
                  <div className="w-3.5 h-3.5 bg-white rounded-xs" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="p-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl shadow-md disabled:opacity-30 disabled:hover:bg-brand-primary transition-all active:scale-95"
                  title="Send message"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 text-center text-[10px] text-slate-500">
            DocMind AI strictly isolates retrieval to documents attached to this chat. Check critical information.
          </div>
        </div>
      </div>

      {/* Chat Personal Knowledge Base Modal */}
      <AnimatePresence>
        {showKnowledgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-white/10 p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <button
                onClick={() => setShowKnowledgeModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Chat Personal Knowledge Base</h3>
                  <p className="text-xs text-slate-400">
                    Only documents attached below will be accessed by DocMind in this conversation.
                  </p>
                </div>
              </div>

              {/* Upload directly to this chat button */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    setShowKnowledgeModal(false);
                    onOpenUploadModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 text-white font-semibold text-xs transition-colors"
                >
                  <Plus className="w-4 h-4 text-brand-primary" />
                  <span>Upload New Document Directly to this Chat</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
                {/* 1. Attached to this chat */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Active in this Chat ({attachedDocs.length})
                    </span>
                    {attachedDocs.length > 0 && (
                      <span className="text-[11px] text-slate-400">
                        {attachedDocs.length} {attachedDocs.length === 1 ? "document" : "documents"} accessible
                      </span>
                    )}
                  </div>

                  {attachedDocs.length > 0 ? (
                    <div className="space-y-2">
                      {attachedDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-brand-primary/20 text-xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText className={`w-4 h-4 shrink-0 ${getFileIconColor(doc.filename)}`} />
                            <div className="truncate">
                              <div className="font-medium text-white truncate">{doc.filename}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {doc.chunk_count || 0} chunks • {doc.file_type?.toUpperCase() || "DOC"}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onDetachDoc(doc.id)}
                            className="px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-white/10 text-center text-xs text-slate-500">
                      No documents attached to this chat. This chat operates with general intelligence & web search only.
                    </div>
                  )}
                </div>

                {/* 2. Available in Library */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      From Your Document Library ({unattachedDocs.length})
                    </span>
                  </div>

                  {documents.length > 4 && (
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filter documents in library..."
                        value={docSearchQuery}
                        onChange={(e) => setDocSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-brand-primary/40"
                      />
                    </div>
                  )}

                  {unattachedDocs.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                      {unattachedDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className={`w-3.5 h-3.5 shrink-0 ${getFileIconColor(doc.filename)}`} />
                            <span className="truncate text-slate-300">{doc.filename}</span>
                          </div>
                          <button
                            onClick={() => onAttachDoc(doc.id)}
                            className="px-2.5 py-1 rounded-lg bg-brand-primary/20 hover:bg-brand-primary/30 text-brand-primary text-xs font-medium transition-colors shrink-0 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Attach</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic p-2">
                      {documents.length === 0
                        ? "Your document library is empty. Upload documents above to begin."
                        : "All documents in your library are already attached to this chat."}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-end">
                <button
                  onClick={() => setShowKnowledgeModal(false)}
                  className="btn-primary px-5 py-2 text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* All Sources Drawer / Modal */}
      <AllSourcesModal
        isOpen={!!activeSourcesModal}
        onClose={() => setActiveSourcesModal(null)}
        sources={activeSourcesModal?.sources || []}
        researchQuery={activeSourcesModal?.researchQuery || ""}
      />
    </div>
  );
}
