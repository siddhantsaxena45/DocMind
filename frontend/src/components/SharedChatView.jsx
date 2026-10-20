import React, { useState, useEffect } from "react";
import { Bot, User, Share2, Copy, Check, ArrowLeft, Loader2, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { api } from "../api";
import MarkdownTableRenderer from "../features/Chat/MarkdownTableRenderer";
import ResearchStatusBar from "../features/Chat/ResearchStatusBar";
import SourceCardsCarousel from "../features/Chat/SourceCardsCarousel";
import FollowupQuestions from "../features/Chat/FollowupQuestions";
import AllSourcesModal from "../features/Chat/AllSourcesModal";

export default function SharedChatView({ shareToken, onBackToApp }) {
  const [loading, setLoading] = useState(true);
  const [sharedData, setSharedData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activeSourcesModal, setActiveSourcesModal] = useState(null);
  const [feedbackMap, setFeedbackMap] = useState({});

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

  const handleFeedback = (msgId, type) => {
    setFeedbackMap((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type
    }));
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
              className={`max-w-[85%] md:max-w-[82%] rounded-2xl p-4 md:p-6 border text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand-primary/90 text-white border-brand-primary/30"
                  : "bg-slate-800/70 border-white/5 text-slate-200"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="space-y-3">
                  {/* Research Status Header */}
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

                  {/* Main Markdown & Table Content */}
                  <MarkdownTableRenderer content={msg.content} messageIdx={idx} />

                  {/* Source Cards Carousel */}
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

                  {/* Follow-up Questions */}
                  {msg.related_questions && msg.related_questions.length > 0 && (
                    <FollowupQuestions
                      questions={msg.related_questions}
                      onSelectQuestion={() => onBackToApp()}
                    />
                  )}

                  {/* Action Toolbar */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <button
                      onClick={() => copyMessage(msg.content, idx)}
                      className="flex items-center gap-1.5 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? (
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

                    <div className="flex items-center gap-1 text-slate-500">
                      <button
                        onClick={() => handleFeedback(msg.id || idx, "liked")}
                        className={`p-1.5 rounded-lg transition-colors ${
                          feedbackMap[msg.id || idx] === "liked"
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "hover:text-slate-200 hover:bg-white/5"
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id || idx, "disliked")}
                        className={`p-1.5 rounded-lg transition-colors ${
                          feedbackMap[msg.id || idx] === "disliked"
                            ? "text-rose-400 bg-rose-500/10"
                            : "hover:text-slate-200 hover:bg-white/5"
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
