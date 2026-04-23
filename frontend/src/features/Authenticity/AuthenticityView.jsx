import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, AlertTriangle, Loader2, CheckCircle, ExternalLink, RotateCcw, Link2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthenticityView({ documentId, userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (force = false) => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/document/${documentId}/verify?user_id=${encodeURIComponent(userId)}&force=${force ? 'true' : 'false'}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
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
      handleVerify(false);
    }
  }, [documentId, userId]);

  if (!documentId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-6 border border-white/5">
          <ShieldCheck className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">Authenticity Shield</h3>
        <p className="text-sm max-w-xs leading-relaxed">Select a document to run a deep-scan verification against live web sources.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar min-h-0">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em]">Integrity Verification</span>
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight">Authenticity Checker</h2>
            <p className="text-slate-400 mt-2 text-sm">AI cross-referencing of factual claims across the live web indices.</p>
          </div>
          
          <button 
            onClick={() => handleVerify(true)} 
            disabled={loading}
            className="btn-ghost flex items-center gap-2 text-xs font-bold uppercase tracking-wider h-11"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <RotateCcw className="w-4 h-4" />}
            {data ? "Re-scan Claims" : "Start Verification"}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mb-8 flex items-center gap-3 text-sm">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-24 glass-card border-white/5">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
              <Loader2 className="w-16 h-16 text-emerald-500 animate-spin relative z-10" />
            </div>
            <p className="text-lg font-bold text-white mb-2 uppercase tracking-widest">Deep Scanning...</p>
            <p className="text-sm text-slate-500 animate-pulse">Consulting live web indices via Gemini 2.5</p>
          </div>
        )}

        {data && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 mb-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="glass-card p-10 text-center relative overflow-hidden group col-span-1">
                  <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-emerald-500 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  <div className="text-7xl font-black text-white mb-2 drop-shadow-2xl">
                    {data.score}<span className="text-2xl opacity-40">%</span>
                  </div>
                  <div className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Integrity Score</div>
               </div>

               <div className="md:col-span-2 glass-card p-10 flex flex-col justify-center">
                  <h3 className="text-lg font-bold text-white mb-3">Verification Summary</h3>
                  <p className="text-slate-400 leading-relaxed text-[15px]">
                    The document has been audited for semantic accuracy. We identified <span className="text-emerald-400 font-bold">{data.verified_sources?.length} verified claims</span> and <span className="text-amber-400 font-bold">{data.unverified_claims?.length} points</span> requiring further scrutiny.
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <section>
                <div className="flex items-center gap-3 mb-6 px-1">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Verified Assertions</h3>
                </div>
                
                <div className="space-y-6">
                  {data.verified_sources?.length === 0 && (
                    <div className="p-8 border border-dashed border-white/5 rounded-3xl text-center text-slate-600 text-sm italic">
                      No verified claims extracted in this section.
                    </div>
                  )}
                  {data.verified_sources?.map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card p-6 md:p-8 hover:border-emerald-500/20 transition-all group"
                    >
                      <div className="text-slate-200 mb-6 prose prose-invert prose-sm max-w-none text-base font-semibold leading-relaxed">
                        <ReactMarkdown>{item.claim}</ReactMarkdown>
                      </div>
                      
                      {item.evidence_snippet && (
                        <div className="mb-6 p-4 bg-slate-950/40 rounded-2xl border border-emerald-500/10 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/30" />
                          <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-2">Live Web Evidence</p>
                          <p className="text-sm text-slate-400 italic leading-relaxed">"{item.evidence_snippet}"</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                         {item.sources.map((src, j) => (
                           <a 
                             key={j} 
                             href={src} 
                             target="_blank" 
                             rel="noreferrer" 
                             className="group/link text-xs font-bold text-slate-400 hover:text-white bg-slate-800/40 hover:bg-emerald-500/20 px-4 py-2 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all flex items-center gap-2"
                           >
                             <Link2 className="w-3.5 h-3.5 group-hover/link:rotate-45 transition-transform" />
                             Source Archive
                           </a>
                         ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6 px-1">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest text-amber-200/60">Anomalies & Unverified Points</h3>
                </div>

                <div className="space-y-6">
                  {data.unverified_claims?.length === 0 && (
                    <div className="p-8 border border-dashed border-white/5 rounded-3xl text-center text-slate-600 text-sm italic">
                      Zero unverified claims detected. Document shows high consistency.
                    </div>
                  )}
                  {data.unverified_claims?.map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (data.verified_sources?.length || 0) * 0.1 + i * 0.1 }}
                      className="glass-card p-6 md:p-8 hover:border-amber-500/20 transition-all border-l-4 border-l-amber-500/30"
                    >
                      <div className="text-slate-300 font-medium mb-4 prose prose-invert prose-sm max-w-none text-base">
                        <ReactMarkdown>{item.claim || item}</ReactMarkdown>
                      </div>
                      {item.reason && (
                        <div className="flex items-start gap-4 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-100/70 leading-relaxed font-medium">{item.reason}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

