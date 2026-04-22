import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatView({ documentId, userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!documentId || !userId) return;
    
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/query/history/${documentId}?user_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.history || []);
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
        setMessages(prev => [...prev, { role: 'ai', content: "I encountered an error: " + data.detail }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: "There was a connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!documentId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-6 border border-white/5">
          <Bot className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">Ready to Chat?</h3>
        <p className="text-sm max-w-xs leading-relaxed">Select a document from the sidebar to start a conversation with your intelligence assistant.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 relative">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-5 shadow-sm border ${
                msg.role === 'ai' 
                  ? 'bg-slate-800/50 border-white/5 text-slate-200' 
                  : 'bg-brand-primary border-brand-primary/20 text-white shadow-brand-primary/20'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                       <Quote className="w-3 h-3" />
                       Citations
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white/5 rounded-lg text-[11px] font-medium text-brand-secondary border border-white/5">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'human' && (
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 flex items-center gap-4">
              <Loader2 className="w-4 h-4 text-brand-secondary animate-spin" />
              <span className="text-slate-400 text-sm font-medium">Processing request...</span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-6 md:p-8 bg-slate-900/80 backdrop-blur-md border-t border-white/5">
        <form onSubmit={handleSend} className="max-w-5xl mx-auto relative group">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about the document..."
            className="w-full glass-input pl-6 pr-16 py-5 text-white shadow-2xl"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl disabled:opacity-50 transition-all shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
             <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Context Aware</span>
             <span className="w-1 h-1 rounded-full bg-slate-800" />
             <span>Instant Synthesis</span>
          </div>
        </form>
      </div>
    </div>
  );
}

