import React, { useState } from 'react';
import { Globe, Search, ExternalLink, Loader2, ShieldCheck, Sparkles, FileText, LayoutPanelTop, Link2, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResearchView() {
  const [topic, setTopic] = useState(() => localStorage.getItem("docmind_research_topic") || "");
  const [data, setData] = useState(() => {
    const cached = localStorage.getItem("docmind_research_data");
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("http://localhost:8000/tools/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail);
      setData(json);
      localStorage.setItem("docmind_research_data", JSON.stringify(json));
      localStorage.setItem("docmind_research_topic", topic);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col p-6 md:p-10 min-h-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/5 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-brand-primary/10 rounded-lg">
                <Globe className="w-5 h-5 text-brand-primary" />
              </div>
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em]">Global Intelligence</span>
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight">AI Research Agent</h2>
            <p className="text-slate-400 mt-2 text-sm">Deep-web synthesis and source credibility auditing for any research domain.</p>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-right">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Network Status</div>
                <div className="flex items-center gap-2 justify-end">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                   <span className="text-xs font-bold text-white">Live Search Active</span>
                </div>
             </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-12 relative max-w-4xl mx-auto w-full group">
          <div className="absolute inset-0 bg-brand-primary/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <input 
            type="text" 
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Search complex engineering topics or academic questions..." 
            className="w-full glass-input pl-8 pr-20 py-6 text-white focus:border-brand-primary/50 shadow-2xl text-xl relative z-10 font-medium"
          />
          <button 
            type="submit" 
            disabled={!topic.trim() || loading}
            className="absolute right-3 top-3 bottom-3 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-2xl px-6 flex items-center justify-center disabled:opacity-50 transition-all shadow-xl shadow-brand-primary/20 z-20"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
          </button>
        </form>

        {error && (
          <div className="p-4 max-w-3xl mx-auto w-full bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl mb-10 flex items-center gap-3 text-sm">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-center items-center py-20"
            >
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full animate-pulse scale-150" />
                <Loader2 className="w-20 h-20 text-brand-primary animate-spin relative z-10" />
              </div>
              <div className="text-center space-y-4">
                <div className="text-brand-primary text-2xl font-bold uppercase tracking-[0.4em] animate-pulse">Gathering Intelligence</div>
                <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">Our agents are navigating peer-reviewed archives and deep-web indices to synthesize your report.</p>
              </div>
            </motion.div>
          ) : data ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-20 pr-2"
            >
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1 glass-card p-8 md:p-12 shadow-inner relative h-fit">
                  <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                     <div className="p-3 bg-indigo-500/10 rounded-2xl">
                        <FileText className="w-6 h-6 text-indigo-400" />
                     </div>
                     <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Synthesis Report</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Multi-Agent Generated Archive</p>
                     </div>
                  </div>
                  
                  <div className="prose prose-invert prose-indigo max-w-none text-slate-300 leading-relaxed text-[17px] prose-headings:text-white prose-p:mb-6 prose-li:mb-2">
                    <ReactMarkdown>{data.report}</ReactMarkdown>
                  </div>
                </div>

                <div className="w-full lg:w-[400px] flex flex-col gap-8 shrink-0">
                  <section>
                     <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                       <ShieldCheck className="w-4 h-4 text-emerald-500" /> Source Integrity
                     </h3>
                     
                     {data.credibility && (
                       <div className="glass-card p-8 border-l-4 border-l-emerald-500/50 bg-emerald-500/5 shadow-2xl shadow-emerald-500/5">
                          <div className="flex items-center justify-between mb-6">
                             <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Overall Confidence</div>
                             <div className="text-3xl font-black text-emerald-400">{data.credibility.overall_credibility_score}%</div>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-6">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${data.credibility.overall_credibility_score}%` }}
                               className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                             />
                          </div>
                          <p className="text-[13px] text-slate-400 leading-relaxed italic font-medium">"{data.credibility.summary}"</p>
                       </div>
                     )}
                  </section>

                  <section className="flex flex-col gap-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                      <Zap className="w-4 h-4 text-brand-secondary" /> Knowledge Nodes
                    </h3>
                    <div className="space-y-4">
                      {data.sources?.map((src, i) => {
                        const eval_item = data.credibility?.evaluations?.find(e => e.url === src.href);
                        return (
                          <motion.a 
                            key={i} 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            href={src.href} 
                            target="_blank" 
                            rel="noreferrer"
                            className="block glass-card p-5 hover:border-brand-primary/30 hover:bg-white/5 transition-all group relative overflow-hidden"
                          >
                            {eval_item && (
                              <div className="absolute top-0 right-0 px-2 py-1 bg-emerald-500/20 text-[9px] font-black text-emerald-400 rounded-bl-xl border-b border-l border-emerald-500/10">
                                {eval_item.score}% REL
                              </div>
                            )}
                            <div className="text-[13px] font-bold text-brand-primary mb-2 truncate group-hover:text-white transition-colors pr-10">[{i+1}] {src.title}</div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-4">{src.body}</p>
                            
                            {eval_item && (
                              <div className="mb-4 p-3 bg-slate-950/40 rounded-xl border border-white/5">
                                 <div className="flex items-center gap-3 mb-2">
                                   <div className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">{eval_item.category}</div>
                                   <div className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${eval_item.bias === "Neutral" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                                     {eval_item.bias}
                                   </div>
                                 </div>
                                 <p className="text-[10px] text-slate-500 italic font-medium leading-relaxed">"{eval_item.notes}"</p>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-auto">
                               <div className="text-[10px] text-slate-600 flex items-center gap-2 font-bold uppercase tracking-widest">
                                  <Link2 className="w-3 h-3" /> {new URL(src.href).hostname}
                               </div>
                               <ExternalLink className="w-3 h-3 text-slate-700 group-hover:text-white transition-colors" />
                            </div>
                          </motion.a>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-6 py-20"
            >
               <LayoutPanelTop className="w-20 h-20" />
               <p className="text-sm font-black uppercase tracking-[0.3em]">Awaiting Intelligence Topic</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

