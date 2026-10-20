import React from "react";
import { Globe, FileText, ExternalLink, Search, MessageSquare, ArrowRight } from "lucide-react";

export default function SourceCardsCarousel({
  sources = [],
  researchQuery,
  onOpenAllSources
}) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-white/5 space-y-2.5">
      {/* Horizontal Scrollable Row of Source Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar -mx-1 px-1">
        {sources.map((src, sIdx) => {
          const isWeb = src.type === "web";
          const siteLabel = src.site_name || (isWeb ? "Web" : src.title);

          return (
            <a
              key={sIdx}
              href={src.url || "#"}
              target={src.url ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="w-56 sm:w-60 shrink-0 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-brand-primary/40 transition-all flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-md"
            >
              <div>
                {/* Header: Favicon/Icon + Site/Subreddit Name + Metadata badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 truncate">
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
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-300 truncate">
                      {siteLabel}
                    </span>
                  </div>

                  {/* Metadata pill */}
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 flex items-center gap-1">
                    {src.page ? `p.${src.page}` : src.site_name?.startsWith("r/") ? `💬 reddit` : <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />}
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
            </a>
          );
        })}
      </div>

      {/* Footer bar under cards: Search Query + View All button */}
      <div className="flex items-center justify-between text-xs pt-1 px-1">
        {researchQuery ? (
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] truncate max-w-[70%]">
            <Search className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">{researchQuery}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">{sources.length} sources referenced</span>
        )}

        {onOpenAllSources && (
          <button
            onClick={onOpenAllSources}
            className="text-[11px] font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1 group shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>
        )}
      </div>
    </div>
  );
}
