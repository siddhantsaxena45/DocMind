import React, { useState } from "react";
import { Layers, LogIn, UserPlus, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

export default function LoginView({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) return;

    setError(null);
    setLoading(true);
    try {
      const fn = mode === "signup" ? api.auth.signup : api.auth.login;
      const data = await fn({ username: username.trim(), password });
      onAuth({
        token: data.access_token,
        userId: data.user_id,
        username: data.username,
      });
    } catch (e) {
      setError(e.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main px-4 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-brand-primary/20 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-brand-secondary/15 rounded-full blur-[140px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-3xl p-8 md:p-10 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-xl shadow-brand-primary/30 mb-5">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">DocMind AI</h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-xs">
              GPT-like Intelligence with Hybrid RAG & Real-Time Web Search
            </p>
          </div>

          <div className="flex p-1 bg-slate-950/60 rounded-xl mb-6 border border-white/5">
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "login"
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              onClick={() => { setMode("login"); setError(null); }}
              disabled={loading}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "signup"
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              onClick={() => { setMode("signup"); setError(null); }}
              disabled={loading}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                className="w-full glass-input text-xs md:text-sm"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                className="w-full glass-input text-xs md:text-sm"
                placeholder="Enter password (min 6 characters)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full btn-primary py-3 text-xs md:text-sm font-semibold mt-5"
              disabled={loading || !username.trim() || !password}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "signup" ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>{mode === "signup" ? "Create Account" : "Sign In to Workspace"}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-6 text-slate-500 text-[11px]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-secondary" />
              <span>User Data Isolation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
              <span>Verified Sources</span>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-slate-600 text-[11px] uppercase tracking-widest font-bold">
          DocMind AI Research Assistant
        </p>
      </motion.div>
    </div>
  );
}