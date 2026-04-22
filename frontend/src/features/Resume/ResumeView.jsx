import React, { useState, useEffect } from 'react';
import { Briefcase, Loader2, AlertTriangle, CheckCircle, Sparkles, Target, Zap, LayoutPanelTop } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResumeView({ documentId, userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobDescription, setJobDescription] = useState("");

  const handleAnalyze = async (force = true) => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/document/${documentId}/resume-critique?user_id=${encodeURIComponent(userId)}&force=${force ? 'true' : 'false'}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jobDescription }),
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
    // Removed auto-run to ensure analysis only happens on button click as requested
  }, [documentId, userId]);

  if (!documentId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-6 border border-white/5">
          <Briefcase className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">Resume Optimizer</h3>
        <p className="text-sm max-w-xs leading-relaxed">Upload and select your resume to receive a high-level ATS critique and optimization plan.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar min-h-0">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 mt-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mx-auto bg-linear-to-br from-brand-primary/20 to-brand-secondary/20 rounded-3xl flex items-center justify-center mb-8 border border-white/10 shadow-2xl shadow-brand-primary/10"
          >
            <Target className="w-10 h-10 text-brand-primary" />
          </motion.div>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">ATS Optimizer Pro</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Our multi-agent system simulates a senior engineering recruiter critique and advanced ATS scanner.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          <div className="md:col-span-7 space-y-6">
            <div className="p-5 bg-amber-500/10 border border-amber-500/20 text-amber-200/80 rounded-2xl text-[13px] leading-relaxed flex items-start gap-4">
              <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <strong className="text-amber-400 block mb-1">Important Constraint</strong>
                This tool is specifically tuned for <span className="font-bold text-white">Engineering Resumes</span>. For academic papers, please use the specialized Paper Analyzer.
              </div>
            </div>

            <div className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Zap className="w-4 h-4 text-brand-secondary" />
                </div>
                <label className="text-sm font-bold text-white uppercase tracking-widest">Job Description Optimization</label>
              </div>
              <textarea 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target role's job description here for a tailored ATS keywords audit..."
                className="w-full h-48 glass-input text-slate-200 placeholder:text-slate-600 focus:border-brand-primary/50 transition-all resize-none shadow-inner"
              />
              <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                 <LayoutPanelTop className="w-3.5 h-3.5" /> Context-aware Analysis Enabled
              </div>
            </div>

            <button 
              onClick={() => handleAnalyze(true)} 
              disabled={loading}
              className="btn-primary w-full py-5 text-lg shadow-xl shadow-brand-primary/10"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
              <span>{data ? 'Regenerate Critique' : 'Execute Optimization'}</span>
            </button>
          </div>

          <div className="md:col-span-5">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center glass-card border-white/5 p-10 min-h-[400px]"
                >
                  <Loader2 className="w-16 h-16 text-brand-primary animate-spin mb-6" />
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs text-center animate-pulse">Running ATS Simulation...</p>
                </motion.div>
              ) : data ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="glass-card p-10 text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                      <Target className="w-20 h-20 text-brand-primary" />
                    </div>
                    <div className="text-7xl font-black bg-linear-to-br from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-3">
                      {data.ats_score}<span className="text-3xl opacity-50">%</span>
                    </div>
                    <div className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Overall ATS Compatibility</div>
                    <div className="mt-6 flex justify-center gap-1.5">
                       {[...Array(5)].map((_, i) => (
                         <div key={i} className={`h-1.5 w-8 rounded-full ${i < Math.round(data.ats_score/20) ? 'bg-brand-primary' : 'bg-slate-800'}`} />
                       ))}
                    </div>
                  </div>

                  <div className="glass-card p-8 border-l-4 border-l-amber-500">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Zap className="w-4 h-4 text-amber-500" /> Gap Analysis
                    </h3>
                    <ul className="space-y-4">
                      {data.missing_sections_or_keywords?.map((k, i) => (
                        <li key={i} className="flex items-start gap-3">
                           <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                           <span className="text-slate-300 text-sm font-medium">{k}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-10 text-slate-600 min-h-[400px]">
                  <CheckCircle className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest text-center">Awaiting Simulation</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {data && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 md:p-12 mb-16 border-l-4 border-l-brand-primary"
          >
            <div className="flex items-center gap-4 mb-10">
               <div className="p-3 bg-brand-primary/10 rounded-2xl">
                  <LayoutPanelTop className="w-6 h-6 text-brand-primary" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Professional Bullet Rewrites</h3>
                  <p className="text-sm text-slate-500">Transform weak statements into high-impact engineering accomplishments.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {data.bullet_rewrites?.map((b, i) => (
                <div key={i} className="p-6 bg-slate-950/40 rounded-2xl border border-white/5 group hover:border-brand-primary/30 transition-colors">
                  <div className="mb-4">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Original Context</span>
                    <p className="text-slate-500 text-[13px] line-through italic leading-relaxed">{b.original}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest block mb-2">AI-Optimized Suggestion</span>
                    <p className="text-slate-200 text-sm font-medium leading-relaxed">{b.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

