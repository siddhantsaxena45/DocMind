import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Code2, Loader2, Play, Check, Copy, Sparkles, Terminal, FileCode, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CodeGenView({ documentId }) {
  const [request, setRequest] = useState(() => localStorage.getItem("docmind_code_request") || "");
  const [code, setCode] = useState(() => localStorage.getItem("docmind_code_data") || "");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!request.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/tools/code?document_id=${documentId || ""}&user_id=testuser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          request,
          context: "" 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setCode(data.code);
      localStorage.setItem("docmind_code_data", data.code);
      localStorage.setItem("docmind_code_request", request);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!code) return;
    const rawCode = code.replace(/```[\s\S]*?\n|```/g, '');
    navigator.clipboard.writeText(rawCode || code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar min-h-0">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/5 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-brand-secondary/10 rounded-lg">
                <Code2 className="w-5 h-5 text-brand-secondary" />
              </div>
              <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-[0.3em]">Neural Synthesis</span>
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight">Code Generation</h2>
            <p className="text-slate-400 mt-2 text-sm">Synthesize production-ready modules and scripts from your project context.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center">
                    <FileCode className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
             </div>
             <span className="text-xs text-slate-500 font-medium">Context-Aware Engine</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-card p-6 flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Terminal className="w-4 h-4 text-brand-secondary" />
                </div>
                <label className="text-sm font-bold text-white uppercase tracking-widest">Logic Request</label>
              </div>
              
              <textarea 
                value={request}
                onChange={e => setRequest(e.target.value)}
                placeholder="E.g., 'Implement a robust data validation layer based on the schema in page 4...'"
                className="flex-1 w-full glass-input p-5 text-slate-200 placeholder:text-slate-600 focus:border-brand-secondary/50 resize-none font-mono text-[13px] leading-relaxed shadow-inner mb-6"
              />
              
              <button 
                onClick={handleGenerate}
                disabled={!request.trim() || loading}
                className="btn-primary w-full py-4 flex justify-center items-center gap-3 shadow-xl shadow-brand-secondary/10"
                style={{ '--brand-color': 'var(--brand-secondary)' }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                <span className="uppercase tracking-widest text-sm font-black">Generate Logic</span>
              </button>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-center gap-3 text-sm font-medium"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-2 glass-card flex flex-col overflow-hidden relative group">
            <div className="bg-slate-950/40 px-6 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-800"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-800"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-800"></div>
                </div>
                <div className="h-4 w-px bg-white/5" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <Terminal className="w-3 h-3" /> Output Buffer
                </span>
              </div>
              {code && (
                <button 
                  onClick={handleCopy} 
                  className="px-3 py-1.5 hover:bg-white/5 text-slate-500 hover:text-white transition-all rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-transparent hover:border-white/5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Checksum Verified" : "Copy Source"}
                </button>
              )}
            </div>

            <div className="flex-1 bg-slate-950/20 p-8 overflow-y-auto custom-scrollbar relative">
              <AnimatePresence>
                {loading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-md z-20"
                  >
                    <div className="text-center">
                       <Loader2 className="w-12 h-12 text-brand-secondary animate-spin mx-auto mb-4 opacity-50" />
                       <div className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.4em] animate-pulse">Compiling Neural Streams</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!code && !loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                  <Sparkles className="w-12 h-12" />
                  <p className="text-xs font-bold uppercase tracking-widest">Awaiting synthesis request...</p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-invert prose-indigo max-w-none prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl"
                >
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="custom-scrollbar"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-slate-800/50 px-1.5 py-0.5 rounded text-brand-secondary" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {code}
                  </ReactMarkdown>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

