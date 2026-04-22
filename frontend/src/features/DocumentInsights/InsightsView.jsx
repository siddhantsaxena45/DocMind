import React, { useEffect, useState } from 'react';
import { Sparkles, FileText, Loader2, Tags, Users, LayoutDashboard, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

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
      handleGenerate(false);
    }
  }, [documentId, userId]);

  if (!documentId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-6 border border-white/5">
          <LayoutDashboard className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">Insight Dashboard</h3>
        <p className="text-sm max-w-xs leading-relaxed">Select a document to generate a comprehensive AI intelligence report.</p>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar min-h-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-brand-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-brand-primary" />
              </div>
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em]">Intelligence Report</span>
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight">Document Insights</h2>
            <p className="text-slate-400 mt-2 text-sm">Deep synthesis of executive summaries, thematic topics, and key entity recognition.</p>
          </div>
          
          <button 
            onClick={() => handleGenerate(true)} 
            disabled={loading}
            className="btn-ghost flex items-center gap-2 text-xs font-bold uppercase tracking-wider h-11"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-brand-secondary" /> : <RefreshCw className="w-4 h-4" />}
            {data ? "Refresh Intelligence" : "Extract Insights"}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mb-8 flex items-center gap-3 text-sm">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             {error}
          </div>
        )}

        {loading && !data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-80 bg-slate-800/20 rounded-3xl border border-white/5 animate-pulse" />
            <div className="h-80 bg-slate-800/20 rounded-3xl border border-white/5 animate-pulse" />
            <div className="h-40 bg-slate-800/20 rounded-3xl border border-white/5 animate-pulse" />
            <div className="h-40 bg-slate-800/20 rounded-3xl border border-white/5 animate-pulse" />
            <div className="h-40 bg-slate-800/20 rounded-3xl border border-white/5 animate-pulse" />
          </div>
        )}

        {data && (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div variants={item} className="md:col-span-2 glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Executive Summary</h3>
              </div>
              <div className="text-slate-300 leading-relaxed text-[15px] prose prose-invert prose-indigo max-w-none prose-p:mb-4">
                <ReactMarkdown>{data.summary}</ReactMarkdown>
              </div>
            </motion.div>
            
            <motion.div variants={item} className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <Tags className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Key Themes</h3>
              </div>
              <div className="space-y-4">
                {data.topics?.map((t, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-1.5 h-1.5 mt-2 rounded-full bg-cyan-500 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                    <span className="text-slate-300 text-sm font-medium leading-relaxed">{t}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={item} className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Linguistic DNA</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.keywords?.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-950/40 border border-white/5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors uppercase tracking-wider">
                    {kw}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div variants={item} className="md:col-span-2 glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                  <Users className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Recognized Entities</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {data.entities?.map((ent, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-slate-950/30 border border-white/5 rounded-2xl group hover:border-pink-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 font-bold group-hover:bg-pink-500 group-hover:text-white transition-all">
                      {ent.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-slate-300 truncate">{ent}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

