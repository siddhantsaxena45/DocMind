import React, { useState } from 'react';
import { Globe, Search, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
    <div className="flex-1 flex flex-col h-full bg-bg-dark p-8">
      <div className="max-w-5xl mx-auto w-full flex flex-col h-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <Globe className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">AI Research Agent</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Deep dive into any topic. Our agents will search the web, read multiple sources, and synthesize a comprehensive report with citations.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-10 relative max-w-3xl mx-auto w-full">
          <input 
            type="text" 
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Ask a deep research question..." 
            className="w-full bg-bg-panel border border-border-dark rounded-xl pl-6 pr-16 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xl text-lg"
          />
          <button 
            type="submit" 
            disabled={!topic.trim() || loading}
            className="absolute right-3 top-3 bottom-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg p-3 flex items-center justify-center disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </form>

        {error && <div className="p-4 max-w-3xl mx-auto w-full bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl mb-6">{error}</div>}

        {loading && (
          <div className="flex-1 flex flex-col justify-center items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
            <div className="text-blue-400 text-lg font-medium animate-pulse">Agents are gathering and reading sources...</div>
          </div>
        )}

        {data && (
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-8 animate-fade-in overflow-y-auto lg:overflow-hidden pb-10 lg:pb-0">
            <div className="flex-1 lg:h-full glass rounded-2xl p-6 lg:p-8 overflow-y-auto scrollbar-hide shrink-0 lg:shrink">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> Research Report
              </h3>
              <div className="prose prose-invert prose-blue max-w-none text-slate-300 leading-relaxed">
                <ReactMarkdown>{data.report}</ReactMarkdown>
              </div>
            </div>

            <div className="w-full lg:w-1/3 flex flex-col gap-4 shrink-0 lg:shrink-0 lg:h-full">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-slate-400" /> Sources Analyzed
              </h3>
              <div className="space-y-4 overflow-y-auto scrollbar-hide pr-2">
                {data.credibility && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mb-6 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> AI Source Analysis
                      </div>
                      <div className="text-xl font-bold text-emerald-400">{data.credibility.overall_credibility_score}%</div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed italic">"{data.credibility.summary}"</p>
                  </div>
                )}

                {data.sources?.map((src, i) => {
                  const eval_item = data.credibility?.evaluations?.find(e => e.url === src.href);
                  return (
                    <a 
                      key={i} 
                      href={src.href} 
                      target="_blank" 
                      rel="noreferrer"
                      className="block p-4 bg-bg-panel border border-border-dark rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group relative overflow-hidden"
                    >
                      {eval_item && (
                        <div className="absolute top-0 right-0 px-2 py-1 bg-emerald-500/20 text-[10px] font-bold text-emerald-400 rounded-bl-lg border-b border-l border-emerald-500/10">
                          {eval_item.score}%
                        </div>
                      )}
                      <div className="text-sm font-semibold text-blue-400 mb-2 truncate group-hover:underline pr-10">[{i+1}] {src.title}</div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-snug mb-3">{src.body}</p>
                      
                      {eval_item && (
                        <div className="mb-3 p-2 bg-slate-900/40 rounded-lg border border-white/5">
                           <div className="flex items-center gap-2 mb-1">
                             <div className="text-[10px] font-bold text-slate-500 uppercase">{eval_item.category}</div>
                             <div className={`w-1 h-1 rounded-full ${eval_item.bias === "Neutral" ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                             <div className="text-[10px] font-bold text-slate-500 uppercase">{eval_item.bias}</div>
                           </div>
                           <p className="text-[10px] text-slate-400 italic">"{eval_item.notes}"</p>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 opacity-60">
                        <ExternalLink className="w-3 h-3" /> {new URL(src.href).hostname}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline FileText for this specific file since it's not imported at the top
const FileText = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
