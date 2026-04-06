import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Code2, Loader2, Play, Check, Copy } from 'lucide-react';

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
    // Extract raw code from markdown for copying
    const rawCode = code.replace(/```[\s\S]*?\n|```/g, '');
    navigator.clipboard.writeText(rawCode || code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
          <Code2 className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Code Generator</h2>
          <p className="text-slate-400">Generate, refactor, or explain code related to your project or document context.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex-1 glass rounded-2xl p-6 flex flex-col">
            <label className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-3">Your Request</label>
            <textarea 
              value={request}
              onChange={e => setRequest(e.target.value)}
              placeholder="E.g., 'Write a Python script that implements the algorithm described in the document'"
              className="flex-1 w-full bg-bg-dark border border-border-dark rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none font-mono text-sm leading-relaxed"
            />
            <button 
              onClick={handleGenerate}
              disabled={!request.trim() || loading}
              className="mt-4 w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-3 rounded-xl flex justify-center items-center gap-2 transition-all shadow-[0_0_15px_rgba(234,88,12,0.4)] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              Generate Code
            </button>
          </div>
          
          {error && <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl">{error}</div>}
        </div>

        <div className="lg:col-span-2 glass rounded-2xl flex flex-col overflow-hidden relative border border-border-dark/60">
          <div className="bg-bg-darker px-4 py-3 border-b border-border-dark flex justify-between items-center">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            </div>
            {code && (
              <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
          <div className="flex-1 bg-bg-dark p-6 overflow-y-auto font-mono text-sm leading-relaxed text-slate-300 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-bg-dark/50 backdrop-blur-sm z-10">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            )}
            {!code && !loading ? (
              <div className="h-full flex items-center justify-center text-slate-600">
                Code output will appear here...
              </div>
            ) : (
              <div className="markdown-container">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {code}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
