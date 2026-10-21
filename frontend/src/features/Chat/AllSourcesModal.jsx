import React from "react";
import { X, ExternalLink, Search, CheckCircle2 } from "lucide-react";
import { SourceFavicon } from "./SourceFavicon";

export default function AllSourcesModal({
  isOpen,
  onClose,
  sources = [],
  researchQuery = ""
}) {
  if (!isOpen) return null;

  // Sort: sources used in the answer first, followed by background search candidates
  const sortedSources = [...sources].sort((a, b) => {
    const aUsed = a.used_in_answer === true ? 1 : 0;
    const bUsed = b.used_in_answer === true ? 1 : 0;
    if (aUsed !== bUsed) return bUsed - aUsed;
    if (a.index && b.index) return a.index - b.index;
    return 0;
  });

  const usedCount = sources.filter((s) => s.used_in_answer === true).length;

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
                All Sources & Grounding Evidence
              </h3>
              <p className="text-xs text-slate-400">
                {usedCount > 0 ? `${usedCount} cited in answer · ` : ""}
                {sources.length} sources evaluated {researchQuery ? `for "${researchQuery}"` : ""}
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
          {sortedSources.map((src, idx) => {
            const isWeb = src.type === "web";
            const siteLabel = src.site_name || (isWeb ? "Web Source" : "Attached Document");
            const isUsed = src.used_in_answer === true;
            const citationNum = src.index;

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl transition-all space-y-2 group border ${
                  isUsed
                    ? "bg-slate-900/90 border-cyan-500/30 ring-1 ring-cyan-500/10 hover:border-cyan-500/50"
                    : "bg-white/[0.02] border-white/5 hover:border-white/10 opacity-70 hover:opacity-100"
                }`}
              >
                {/* Source Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 truncate">
                    {/* Citation Number if used */}
                    {citationNum && (
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                        {citationNum}
                      </span>
                    )}

                    <SourceFavicon
                      src={src.favicon}
                      url={src.url}
                      siteName={siteLabel}
                      isWeb={isWeb}
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                      fallbackClassName={isWeb ? "w-4 h-4 text-cyan-400 shrink-0" : "w-4 h-4 text-brand-primary shrink-0"}
                    />
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {siteLabel}
                    </span>

                    {/* Status Pill */}
                    {isUsed ? (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Used in answer
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                        Background search hit
                      </span>
                    )}

                    {src.page && (
                      <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-white/5 shrink-0">
                        Page {src.page}
                      </span>
                    )}
                  </div>

                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium shrink-0 group-hover:underline"
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
                  <p className="text-xs text-slate-400 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                    {src.snippet}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {usedCount} of {sources.length} sources directly informed the synthesis
          </span>
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
