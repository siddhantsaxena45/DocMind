import React, { useState } from "react";
import { Layers, LogIn, UserPlus, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginView({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Authentication failed");
      onAuth({
        token: json.access_token,
        userId: json.user_id,
        username: json.username,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/15 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass rounded-[2rem] p-10 md:p-14 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col items-center text-center mb-10">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-2xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-xl shadow-brand-primary/30 mb-6"
            >
              <Layers className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Welcome to DocMind</h1>
            <p className="text-slate-400 max-w-xs">Your personal AI-powered document intelligence workspace.</p>
          </div>

          <div className="flex p-1.5 bg-slate-950/50 rounded-2xl mb-8 border border-white/5">
            <button
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              onClick={() => setMode("login")}
              disabled={loading}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                mode === "signup"
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              onClick={() => setMode("signup")}
              disabled={loading}
            >
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                   <ShieldCheck className="w-4 h-4" />
                   {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <input
                    className="w-full glass-input pl-4"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="relative group">
                  <input
                    className="w-full glass-input pl-4"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <button
                  className="w-full btn-primary mt-4 group"
                  onClick={submit}
                  disabled={loading || !username.trim() || !password}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === "signup" ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                      <span>{mode === "signup" ? "Get Started" : "Continue to Workspace"}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-center gap-6 text-slate-500">
             <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-secondary" />
                <span>Secure Access</span>
             </div>
             <div className="flex items-center gap-2 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                <span>AI Powered</span>
             </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-600 text-[11px] uppercase tracking-widest font-bold">
          DocMind Intelligence Platform v2.0
        </p>
      </motion.div>
    </div>
  );
}