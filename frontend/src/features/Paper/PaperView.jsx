import React, { useState, useEffect } from 'react';
import { GraduationCap, Loader2, Sparkles, BookOpen, Database, Target, ArrowRightCircle, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaperView({ documentId, userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (force = true) => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/document/${documentId}/paper-analysis?user_id=${encodeURIComponent(userId)}&force=${force ? 'true' : 'false'}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail);
      setData(json);
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
      handleAnalyze(false);
    }
  }, [documentId, userId]);

  if (!documentId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-6 border border-white/5">
          <GraduationCap className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">Academic Analyzer</h3>
        <p className="text-sm max-w-xs leading-relaxed">Select a research paper to extract methodologies, datasets, and future research directions.</p>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full">
      <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar min-h-0 w-full">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-8 border-b border-white/5">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-indigo-500" />
                </div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em]">Academic Insight</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">Paper Analysis</h2>
              <p className="text-slate-400 mt-2 text-sm">Deep methodology extraction and limitation mapping for academic publications.</p>
            </div>
            
            <button 
              onClick={() => handleAnalyze(true)} 
              disabled={loading}
              className="btn-ghost flex items-center gap-2 text-xs font-bold uppercase tracking-wider h-11 w-full md:w-auto justify-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <RefreshCw className="w-4 h-4" />}
              {data ? "Refresh Extraction" : "Analyze Paper"}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mb-8 flex items-center gap-3 text-sm">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-8 space-y-8">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="glass-card p-12 md:p-20 flex flex-col items-center justify-center text-center"
                    >
                      <div className="relative mb-8">
                         <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                         <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-indigo-500 animate-spin relative z-10" />
                      </div>
                      <p className="text-base md:text-lg font-bold text-white mb-2 uppercase tracking-[0.2em]">Peer Review In Progress</p>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">Agents are decomposing methodologies and validating research claims...</p>
                    </motion.div>
                  ) : data ? (
                    <motion.div 
                      key="content"
                      variants={container}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                       <div className="lg:col-span-8 space-y-8">
                          <motion.div variants={item} className="glass-card p-6 md:p-8 border-l-4 border-l-indigo-500">
                             <div className="flex items-center gap-3 mb-6">
                                <Target className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Research Objective</h3>
                             </div>
                             <p className="text-slate-300 leading-relaxed text-[14px] md:text-[15px] font-medium italic">
                                "{data.research_objective || "No objective extracted."}"
                             </p>
                          </motion.div>

                          <motion.div variants={item} className="glass-card p-6 md:p-8">
                             <div className="flex items-center gap-3 mb-6">
                                <BookOpen className="w-5 h-5 text-cyan-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Core Methodology</h3>
                             </div>
                             <div className="space-y-4">
                                {data.methodology?.length > 0 ? data.methodology.map((m, i) => (
                                  <div key={i} className="flex items-start gap-4 p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                                     <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 text-[10px] font-bold shrink-0 mt-0.5">
                                       {i+1}
                                     </div>
                                     <span className="text-slate-300 text-sm font-medium leading-relaxed">{m}</span>
                                  </div>
                                )) : (
                                  <p className="text-slate-500 text-sm italic">Methodology details not available.</p>
                                )}
                             </div>
                          </motion.div>

                          <motion.div variants={item} className="glass-card p-6 md:p-8 border-l-4 border-l-emerald-500/50">
                             <div className="flex items-center gap-3 mb-6">
                                <ArrowRightCircle className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest text-emerald-200/80">Future Scope</h3>
                             </div>
                             <p className="text-slate-300 leading-relaxed text-[14px] md:text-[15px] font-medium">
                                {data.future_scope || "Future scope not defined."}
                             </p>
                          </motion.div>
                       </div>

                       <div className="lg:col-span-4 space-y-8">
                          <motion.div variants={item} className="glass-card p-6">
                             <div className="flex items-center gap-3 mb-6">
                                <Database className="w-4 h-4 text-amber-400" />
                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Data & Tools</h3>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {data.datasets_used?.length > 0 ? data.datasets_used.map((d, i) => (
                                  <span key={i} className="px-3 py-1.5 bg-linear-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] font-bold text-amber-200/80">
                                    {d}
                                  </span>
                                )) : <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">None identified</p>}
                             </div>
                          </motion.div>

                          <motion.div variants={item} className="glass-card p-6 border-l-4 border-l-red-500/50">
                             <div className="flex items-center gap-3 mb-6">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Limitations</h3>
                             </div>
                             <ul className="space-y-3">
                                {data.limitations?.length > 0 ? data.limitations.map((l, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                     <div className="w-1 h-1 mt-1.5 rounded-full bg-red-500 shrink-0" />
                                     <span className="text-slate-400 text-xs font-medium leading-relaxed">{l}</span>
                                  </li>
                                )) : <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">No limitations noted</p>}
                             </ul>
                          </motion.div>
                       </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4"
                    >
                       <Sparkles className="w-12 h-12" />
                       <p className="text-xs font-black uppercase tracking-widest">Ready for Analysis</p>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      </div>
    </div>

  );
}

