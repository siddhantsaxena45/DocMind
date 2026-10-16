import React, { useState, useEffect } from "react";
import { Bot, User, Share2, Quote, Globe, ExternalLink, Copy, Check, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { api } from "../api";

export default function SharedChatView({ shareToken, onBackToApp }) {
  const [loading, setLoading] = useState(true);
  const [sharedData, setSharedData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    async function fetchSharedChat() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.share.get(shareToken);
        setSharedData(data);
      } catch (err) {
        setError(err.message || "This shared conversation link has expired or been revoked.");
      } finally {
        setLoading(false);
      }
    }
    fetchSharedChat();
  }, [shareToken]);

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-bg-main text-slate-400 gap-4">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        <p className="text-sm">Loading shared conversation...</p>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-bg-main p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <Share2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Conversation Unavailable</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error}</p>
        <button
          onClick={onBackToApp}
          className="btn-primary px-6 py-2.5 text-xs font-semibold"
        >
          Go to DocMind Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-bg-main overflow-hidden">
      {/* Header */}
      <header className="h-16 px-4 md:px-8 border-b border-white/5 flex items-center justify-between bg-slate-900/60 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToApp}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Back to DocMind"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm md:text-base font-bold text-white truncate max-w-xs md:max-w-md">
              {sharedData.title}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1 text-brand-secondary">
                <Share2 className="w-3 h-3" /> Shared Chat Snapshot
              </span>
              <span>•</span>
              <span>{sharedData.created_at ? new Date(sharedData.created_at).toLocaleDateString() : ""}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onBackToApp}
          className="btn-primary px-4 py-2 text-xs font-semibold"
        >
          Try DocMind AI
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full custom-scrollbar">
        {sharedData.messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 md:gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div
              className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 md:p-6 border text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand-primary/90 text-white border-brand-primary/30"
                  : "bg-slate-800/70 border-white/5 text-slate-200"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none space-y-3">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <div className="rounded-xl overflow-hidden my-3 border border-white/10">
                            <div className="bg-slate-950 px-3 py-1.5 text-[11px] font-mono text-slate-400 border-b border-white/10 flex justify-between items-center">
                              <span>{match[1]}</span>
                            </div>
                            <SyntaxHighlighter
                              style={atomDark}
                              language={match[1]}
                              PreTag="div"
                              className="!m-0 !bg-slate-950/90 text-xs"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
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
                    {msg.content}
                  </ReactMarkdown>

                  {/* Sources / Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        <Quote className="w-3 h-3" /> Sources Cited
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

                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => copyMessage(msg.content, idx)}
                      className="text-xs text-slate-400 hover:text-white p-1 rounded transition-colors"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-300" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
