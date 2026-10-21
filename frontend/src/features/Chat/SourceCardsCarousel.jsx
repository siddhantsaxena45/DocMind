import React from "react";
import { Globe, FileText, ExternalLink, Search, CheckCircle2, ArrowRight } from "lucide-react";

export default function SourceCardsCarousel({
  sources = [],
  researchQuery,
  onOpenAllSources
}) {
  if (!sources || sources.length === 0) return null;

  // Filter sources to display ONLY those actually used / grounded in the answer.
  // If sources explicitly have used_in_answer flags, show only used_in_answer === true.
  const hasExplicitFlags = sources.some((s) => s.used_in_answer !== undefined);
  const usedSources = hasExplicitFlags
    ? sources.filter((s) => s.used_in_answer === true)
    : sources;

  // If no sources were verified as used in the answer, do not display misleading cards
  if (usedSources.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-3.5 border-t border-white/5 space-y-2.5">
      {/* Section Header: Clearly indicates these are the sources actually used in synthesis */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px] tracking-wide uppercase">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cited Sources ({usedSources.length})</span>
        </div>

        {onOpenAllSources && sources.length > usedSources.length && (
          <button
            onClick={onOpenAllSources}
            className="text-[11px] font-medium text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 group shrink-0"
          >
            <span>All {sources.length} evaluated</span>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Row of Used Source Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar -mx-1 px-1">
        {usedSources.map((src, sIdx) => {
          const isWeb = src.type === "web";
          const siteLabel = src.site_name || (isWeb ? "Web Source" : src.title);
          const citationNum = src.index || (sIdx + 1);

          return (
            <a
              key={sIdx}
              id={`source-card-${citationNum}`}
              href={src.url || "#"}
              target={src.url ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="w-60 sm:w-64 shrink-0 p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-white/10 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              title={src.url ? `Open source link: ${src.url}` : src.title}
            >
              <div>
                {/* Header: Citation Number + Site Favicon/Name + Used Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 truncate">
                    {/* Citation Number Pill */}
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                      {citationNum}
                    </span>

                    {/* Favicon or Doc Icon */}
                    {src.favicon ? (
                      <img
                        src={src.favicon}
                        alt=""
                        className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : isWeb ? (
                      <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    )}

                    <span className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate">
                      {siteLabel}
                    </span>
                  </div>

                  {/* Metadata / Page indicator */}
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md">
                    {src.page ? (
                      `p.${src.page}`
                    ) : src.url ? (
                      <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100 group-hover:text-cyan-300" />
                    ) : null}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug mb-1.5">
                  {src.title}
                </h4>

                {/* Snippet */}
                {src.snippet && (
                  <p className="text-[11px] text-slate-400 group-hover:text-slate-300 line-clamp-2 leading-relaxed">
                    {src.snippet}
                  </p>
                )}
              </div>

              {/* Card Footer: Used Indicator */}
              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                <span className="text-emerald-400/90 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Used in answer
                </span>
                <span className="font-mono text-slate-400 group-hover:text-cyan-300">
                  [{citationNum}]
                </span>
              </div>
            </a>
          );
        })}
      </div>

      {/* Footer bar under cards: Search Query + View All button */}
      <div className="flex items-center justify-between text-xs pt-1 px-1">
        {researchQuery ? (
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] truncate max-w-[70%]">
            <Search className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">Researched: <strong className="text-slate-300 font-medium">{researchQuery}</strong></span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">{usedSources.length} grounded sources cited</span>
        )}

        {onOpenAllSources && (
          <button
            onClick={onOpenAllSources}
            className="text-[11px] font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1 group shrink-0"
          >
            <span>View all sources</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>
        )}
      </div>
    </div>
  );
}
