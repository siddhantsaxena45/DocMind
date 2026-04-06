import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { authHeader } from '../../auth';

export default function ChatView({ documentId, userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!documentId || !userId) return;
    
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/query/history/${documentId}?user_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.history || []);
        } else {
          console.error("Failed to load chat history", res.status);
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [documentId, userId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !documentId) return;

    const userMsg = input.trim();
    setInput("");
    
    setMessages(prev => [...prev, { role: 'human', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          document_id: documentId,
          text: userMsg
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: data.answer,
          sources: data.sources 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: "Error: " + data.detail }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: "Connection error." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!documentId) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        Please select a document first to start chatting.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-dark relative">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 inset-x-0 h-64 bg-linear-to-b from-primary-900/10 to-transparent pointer-events-none"></div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0 border border-primary-500/30">
                <Bot className="w-4 h-4 text-primary-500" />
              </div>
            )}
            
            <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
              msg.role === 'ai' 
                ? 'bg-bg-panel border border-border-dark text-slate-200' 
                : 'bg-primary-600 text-white'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border-dark/50">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Sources</div>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-white/5 rounded text-xs text-slate-400 border border-white/5">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'human' && (
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                <User className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-4 p-6">
            <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center border border-primary-500/30">
              <Bot className="w-4 h-4 text-primary-500" />
            </div>
            <div className="bg-bg-panel border border-border-dark rounded-2xl px-5 py-4 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
              <span className="text-slate-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 z-10 bg-bg-dark border-t border-border-dark">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about this document..."
            className="w-full bg-bg-panel border border-border-dark rounded-xl pl-6 pr-14 py-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-lg"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-3 p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg disabled:opacity-50 transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
