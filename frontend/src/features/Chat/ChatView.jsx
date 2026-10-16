import React, { useState, useEffect, useRef } from "react";
import {
  Send, Bot, User, Loader2, Sparkles, Quote, Globe, Share2,
  Copy, Check, RotateCcw, Menu, ExternalLink, ChevronDown,
  Paperclip, ArrowUp, AlertCircle, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { api } from "../../api";
import { loadAuth } from "../../auth";

const PROMPT_SUGGESTIONS = [
  "Summarize the key findings, methodologies, and conclusions",
  "Compare document claims with verified real-time web facts",
  "Extract important numerical metrics into a structured table",
  "Highlight any potential risks, liabilities, or unanswered questions"
];

export default function ChatView({
  conversation,
  onUpdateConversation,
  onSidebarToggle,
  onOpenShareModal,
  onOpenUploadModal,
  documents
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState(null);
  const [copiedCodeKey, setCopiedCodeKey] = useState(null);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

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

    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    const auth = loadAuth();
    const token = auth?.token;

    // 2. Prepare streaming assistant placeholder
    const assistantMsgPlaceholder = {
      id: `ai_${Date.now()}`,
      role: "assistant",
      content: "",
      sources: [],
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, assistantMsgPlaceholder]);

    // Construct stream URL
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const selectedDocsQuery = (conversation.selected_doc_ids || []).join(",");
    const url = new URL(`${baseUrl}/api/conversations/${conversation.id}/messages/stream`);
    url.searchParams.set("text", textToSend);
    url.searchParams.set("token", token || "");
    url.searchParams.set("web_search", String(conversation.web_search_enabled));
    if (selectedDocsQuery) {
      url.searchParams.set("selected_docs", selectedDocsQuery);
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

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = null;

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
                      content: updated[lastIdx].content + parsed.chunk
                    };
                  }
                  return updated;
                });
              } else if (currentEvent === "done" && parsed.message_id) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = { ...updated[lastIdx], id: parsed.message_id };
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
        console.error("Stream error, falling back to standard POST:", err);
        // Fallback to standard POST
        try {
          const fallbackRes = await api.conversations.sendMessage(conversation.id, {
            text: textToSend,
            web_search: conversation.web_search_enabled,
            selected_doc_ids: conversation.selected_doc_ids
          });

          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
              updated[lastIdx] = {
                id: fallbackRes.message_id,
                role: "assistant",
                content: fallbackRes.answer,
                sources: fallbackRes.sources,
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

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRegenerate = async () => {
    if (streaming || !conversation?.id) return;
    setStreaming(true);
    setError(null);
    try {
      const res = await api.conversations.regenerate(conversation.id);
      setMessages((prev) => {
        // Filter out last assistant message
        const withoutLastAi = prev.filter((m, i) => !(i === prev.length - 1 && m.role === "assistant"));
        return [
          ...withoutLastAi,
          {
            id: res.message_id,
            role: "assistant",
            content: res.answer,
            sources: res.sources,
            created_at: new Date().toISOString()
          }
        ];
      });
    } catch (err) {
      setError(err.message || "Regeneration failed");
    } finally {
      setStreaming(false);
    }
  };

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  };

  const handleCopyCode = (code, key) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeKey(key);
    setTimeout(() => setCopiedCodeKey(null), 2000);
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

  // Document filter info
  const selectedCount = conversation?.selected_doc_ids?.length || 0;
  const docFilterText = selectedCount > 0 ? `${selectedCount} Docs Filtered` : "All Documents";

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
              <span>{docFilterText}</span>
              <span>•</span>
              <span className={conversation?.web_search_enabled ? "text-cyan-400" : "text-slate-500"}>
                Web Search {conversation?.web_search_enabled ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
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
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="max-w-2xl mx-auto py-12 md:py-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-xl shadow-brand-primary/20 mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
              How can I help you today?
            </h3>
            <p className="text-slate-400 text-xs md:text-sm max-w-md leading-relaxed mb-8">
              Ask deep questions about your uploaded documents, synthesize real-time web facts, or explore complex analytical topics with verified citations.
            </p>

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

            {documents.length === 0 && (
              <div className="mt-8 flex items-center gap-2 text-xs text-slate-500">
                <FileText className="w-4 h-4 text-brand-secondary" />
                <span>Tip: Upload documents via the sidebar to enable full RAG synthesis.</span>
              </div>
            )}
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
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="space-y-3">
                      {/* Markdown rendering */}
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || "");
                              const codeString = String(children).replace(/\n$/, "");
                              const codeKey = `code_${idx}_${match ? match[1] : "txt"}`;

                              return !inline && match ? (
                                <div className="rounded-xl overflow-hidden my-3 border border-white/10">
                                  <div className="bg-slate-950 px-3 py-1.5 text-[11px] font-mono text-slate-400 border-b border-white/10 flex justify-between items-center">
                                    <span>{match[1]}</span>
                                    <button
                                      onClick={() => handleCopyCode(codeString, codeKey)}
                                      className="flex items-center gap-1 hover:text-white transition-colors"
                                    >
                                      {copiedCodeKey === codeKey ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span className="text-[10px]">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span className="text-[10px]">Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={atomDark}
                                    language={match[1]}
                                    PreTag="div"
                                    className="!m-0 !bg-slate-950/90 text-xs"
                                    {...props}
                                  >
                                    {codeString}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            table({ children }) {
                              return (
                                <div className="overflow-x-auto my-3 rounded-xl border border-white/10">
                                  <table className="w-full text-left text-xs border-collapse">{children}</table>
                                </div>
                              );
                            },
                            th({ children }) {
                              return <th className="bg-white/5 px-3 py-2 border-b border-white/10 font-bold">{children}</th>;
                            },
                            td({ children }) {
                              return <td className="px-3 py-2 border-b border-white/5">{children}</td>;
                            },
                          }}
                        >
                          {msg.content || (streaming && isLastMessage ? "Thinking..." : "")}
                        </ReactMarkdown>
                      </div>

                      {/* Sources / Citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            <Quote className="w-3 h-3 text-brand-secondary" /> Sources & Citations
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {msg.sources.map((s, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-brand-secondary font-medium transition-colors"
                              >
                                {s.type === "web" ? <Globe className="w-3 h-3 shrink-0" /> : <Quote className="w-3 h-3 shrink-0" />}
                                {s.url ? (
                                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                    {s.title} <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <span>{s.title}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons (Copy, Regenerate) */}
                      {!streaming && msg.content && (
                        <div className="mt-3 flex items-center gap-3 pt-2 text-xs text-slate-400">
                          <button
                            onClick={() => handleCopyMessage(msg.content, idx)}
                            className="flex items-center gap-1 hover:text-white transition-colors"
                            title="Copy response"
                          >
                            {copiedMsgIdx === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[11px]">Copied</span>
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
                              className="flex items-center gap-1 hover:text-white transition-colors"
                              title="Regenerate answer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Regenerate</span>
                            </button>
                          )}
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
          <div className="relative rounded-2xl bg-slate-900 border border-white/10 shadow-xl focus-within:border-brand-primary/50 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your documents or search the web..."
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

              {/* Upload file icon button */}
              <button
                type="button"
                onClick={onOpenUploadModal}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                title="Upload document"
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
            DocMind AI uses hybrid vector retrieval and verified source citations. Check critical information.
          </div>
        </div>
      </div>
    </div>
  );
}
