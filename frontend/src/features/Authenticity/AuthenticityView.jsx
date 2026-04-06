import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, AlertTriangle, Loader2, CheckCircle, ExternalLink, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
      // Auto-load cached verification result (if any)
      handleVerify(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, userId]);

  if (!documentId) return <div className="p-8 text-slate-400">Select a document first.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto scrollbar-hide">
      <div className="text-center mb-12 mt-8">
        <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Authenticity Checker</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          We use AI to extract core factual claims from your document and cross-reference them across the live web using free search APIs.
        </p>
      </div>

      {!data && !loading && (
        <div className="text-center">
          <button onClick={() => handleVerify(true)} className="primary-button px-8 py-4 rounded-xl text-lg flex items-center justify-center mx-auto gap-3 w-64">
            <ShieldCheck className="w-5 h-5" />
            Verify Document
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
          <p className="text-slate-400">Deep-scanning document claims...</p>
          <p className="text-xs text-slate-500 mt-2 animate-pulse text-center max-w-xs">Connecting to Gemini 2.5 Flash & searching live web sources...</p>
        </div>
      )}

      {error && <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl mb-8">{error}</div>}

      {data && (
        <div className="space-y-8 animate-fade-in mb-12">
          <div className="glass p-8 rounded-2xl text-center relative overflow-hidden backdrop-blur-xl border-white/10 group">
            <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-emerald-500 to-teal-500"></div>
            
            <button 
              onClick={() => handleVerify(true)}
              disabled={loading}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg border border-white/5 hover:border-emerald-500/30 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 text-xs font-semibold"
              title="Force Re-verify (Updates Cache)"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Recheck
            </button>

            <div className="text-6xl font-bold bg-clip-text text-transparent bg-linear-to-br from-emerald-400 to-teal-400 mb-2">
              {data.score}%
            </div>
            <div className="text-slate-400 font-medium uppercase tracking-widest text-xs">Authenticity Score</div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="glass p-8 rounded-2xl border-l-4 border-l-emerald-500 bg-emerald-500/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                <CheckCircle className="w-6 h-6 text-emerald-500" /> Verified Claims
              </h3>
              <div className="space-y-6">
                {data.verified_sources?.length === 0 && <p className="text-slate-500 italic">No verified claims found in the analyzed section.</p>}
                {data.verified_sources?.map((item, i) => (
                  <div key={i} className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
                    <div className="text-slate-200 mb-4 prose prose-invert prose-sm max-w-none font-medium text-base">
                      <ReactMarkdown>{item.claim}</ReactMarkdown>
                    </div>
                    
                    {item.evidence_snippet && (
                      <div className="mb-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <p className="text-xs text-emerald-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                           <Search className="w-3 h-3" /> Found Evidence:
                        </p>
                        <p className="text-sm text-slate-300 italic">"{item.evidence_snippet}"</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                       {item.sources.map((src, j) => (
                         <a key={j} href={src} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-1.5 transition-all">
                           <ExternalLink className="w-3 h-3" /> Source {j+1}
                         </a>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-8 rounded-2xl border-l-4 border-l-amber-500 bg-amber-500/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-amber-500" /> Unverified Claims
              </h3>
              <div className="space-y-6">
                {data.unverified_claims?.length === 0 && <p className="text-slate-500 italic">No significant unverified claims detected.</p>}
                {data.unverified_claims?.map((item, i) => (
                  <div key={i} className="bg-slate-900/40 p-5 rounded-2xl border border-white/5">
                    <div className="text-slate-200 font-medium mb-3 prose prose-invert prose-sm max-w-none text-base">
                      <ReactMarkdown>{item.claim || item}</ReactMarkdown>
                    </div>
                    {item.reason && (
                      <div className="flex items-start gap-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-200/90 leading-relaxed">{item.reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
