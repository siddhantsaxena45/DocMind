import React from "react";
import { X, Globe, FileText, ExternalLink, Search } from "lucide-react";

export default function AllSourcesModal({
  isOpen,
  onClose,
  sources = [],
  researchQuery = ""
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-white/5 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                All Sources & Citations
              </h3>
              <p className="text-xs text-slate-400">
                {sources.length} sources referenced {researchQuery ? `for "${researchQuery}"` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5 custom-scrollbar">
          {sources.map((src, idx) => {
            const isWeb = src.type === "web";
            const siteLabel = src.site_name || (isWeb ? "Web Source" : "Attached Document");

            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all space-y-2 group"
              >
                {/* Source Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 truncate">
                    {src.favicon ? (
                      <img
                        src={src.favicon}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover shrink-0"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : isWeb ? (
                      <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-brand-primary shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-300 truncate">
                      {siteLabel}
                    </span>
                    {src.page && (
                      <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.5 rounded bg-white/5">
                        Page {src.page}
                      </span>
                    )}
                  </div>

                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-secondary hover:text-white flex items-center gap-1 font-medium shrink-0 group-hover:underline"
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {src.title}
                </h4>

                {/* Snippet */}
                {src.snippet && (
                  <p className="text-xs text-slate-400 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                    {src.snippet}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
