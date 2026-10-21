import React, { useState, useEffect } from "react";
import { X, Copy, Check, Share2, ShieldAlert, Loader2, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

export default function ShareModal({ isOpen, onClose, conversationId, conversationTitle }) {
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (isOpen && conversationId) {
      loadShareLink();
    } else {
      setShareData(null);
      setCopied(false);
      setError(null);
    }
  }, [isOpen, conversationId]);

  const loadShareLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.share.create(conversationId);
      setShareData(data);
    } catch (err) {
      setError(err.message || "Failed to generate share link");
    } finally {
      setLoading(false);
    }
  };

  const fullShareUrl = shareData ? `${window.location.origin}${shareData.share_url}` : "";

  const handleCopy = () => {
    if (!fullShareUrl) return;
    navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevoke = async () => {
    if (!shareData?.share_token) return;
    if (!window.confirm("Are you sure you want to revoke this public link? Anyone with the link will lose access.")) return;
    setRevoking(true);
    try {
      await api.share.revoke(shareData.share_token);
      setShareData(null);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to revoke share link");
    } finally {
      setRevoking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-2xl bg-[#0c0c0f] border border-amber-500/20 p-6 md:p-8 shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/25">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Share Conversation</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{conversationTitle || "Active Chat"}</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              <p className="text-sm text-slate-400">Generating secure share link...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              {error}
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs text-slate-300 leading-relaxed">
                Messages, code snippets, and citations in this conversation snapshot are accessible to anyone with this link. Your documents and account credentials remain completely private.
              </p>

              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/60 border border-amber-500/20">
                <input
                  type="text"
                  readOnly
                  value={fullShareUrl}
                  className="flex-1 bg-transparent px-3 py-2 text-xs md:text-sm text-slate-200 outline-none select-all"
                />
                <button
                  onClick={handleCopy}
                  className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-all active:scale-95 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-amber-500/15">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" /> Public Snapshot
                </span>

                <button
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="text-xs text-red-400 hover:text-red-300 hover:underline disabled:opacity-50 transition-colors"
                >
                  {revoking ? "Revoking..." : "Revoke Access"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
