import React, { useEffect, useState } from 'react';
import { Sparkles, FileText, Loader2, Tags, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function InsightsView({ documentId, userId }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (force = false) => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/document/${documentId}/insights?user_id=${encodeURIComponent(userId)}&force=${force ? 'true' : 'false'}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Failed to parse insights");
      setData(json.insights);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setData(null);
    setError(null);
    if (documentId && userId) {
      // Auto-load cached insights (fast) when switching tabs/docs.
      handleGenerate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, userId]);

  if (!documentId) return <div className="p-8 text-slate-400">Select a document first.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary-400 to-indigo-400 mb-2">
            Document Insights
          </h2>
          <p className="text-slate-400">AI-generated summary, topics, and key entities.</p>
        </div>
        {!data && (
          <button 
            onClick={() => handleGenerate(true)} 
            disabled={loading}
            className="primary-button px-6 py-3 rounded-xl flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate Insights
          </button>
        )}
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl mb-6">{error}</div>}

      {loading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-48 bg-bg-panel border border-border-dark rounded-xl md:col-span-2"></div>
          <div className="h-48 bg-bg-panel border border-border-dark rounded-xl"></div>
          <div className="h-32 bg-bg-panel border border-border-dark rounded-xl"></div>
          <div className="h-32 bg-bg-panel border border-border-dark rounded-xl"></div>
          <div className="h-32 bg-bg-panel border border-border-dark rounded-xl"></div>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="md:col-span-2 glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary-500" /> Executive Summary
            </h3>
            <div className="text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{data.summary}</ReactMarkdown>
            </div>
          </div>
          
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Tags className="w-5 h-5 text-indigo-400" /> Key Topics
            </h3>
            <ul className="space-y-3">
              {data.topics?.map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 mt-2 rounded-full bg-indigo-500 shrink-0"></span>
                  <span className="text-slate-300 text-sm leading-tight">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-400" /> Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.keywords?.map((kw, i) => (
                <span key={i} className="px-3 py-1.5 bg-bg-dark border border-border-dark rounded-lg text-xs font-medium text-slate-300">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-pink-500" /> Named Entities
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {data.entities?.map((ent, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-bg-dark/50 border border-border-dark rounded-lg">
                  <div className="w-8 h-8 rounded bg-pink-500/10 flex items-center justify-center text-pink-500 font-bold">
                    {ent.charAt(0)}
                  </div>
                  <span className="text-sm text-slate-200">{ent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
