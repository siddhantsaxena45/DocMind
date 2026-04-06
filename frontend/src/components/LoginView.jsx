import React, { useState } from "react";
import { Layers, LogIn, UserPlus } from "lucide-react";

export default function LoginView({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | signup
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
    <div className="min-h-screen flex items-center justify-center bg-bg-dark text-slate-200 px-4">
      <div className="w-full max-w-md glass rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.5)]">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">DocMind</div>
            <div className="text-xs text-slate-400">Sign in to your workspace</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
              mode === "login"
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-border-dark text-slate-400 hover:bg-white/5"
            }`}
            onClick={() => setMode("login")}
            disabled={loading}
          >
            Sign in
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
              mode === "signup"
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-border-dark text-slate-400 hover:bg-white/5"
            }`}
            onClick={() => setMode("signup")}
            disabled={loading}
          >
            Sign up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input
            className="w-full px-4 py-3 rounded-xl bg-bg-darker border border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            autoComplete="username"
          />
          <input
            className="w-full px-4 py-3 rounded-xl bg-bg-darker border border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />

          <button
            className="w-full primary-button px-4 py-3 rounded-xl flex items-center justify-center gap-2"
            onClick={submit}
            disabled={loading || !username.trim() || !password}
          >
            {mode === "signup" ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </div>

        <div className="mt-6 text-xs text-slate-500">
          This is a local-dev auth system (JWT). For production youd typically use OAuth/SSO.
        </div>
      </div>
    </div>
  );
}