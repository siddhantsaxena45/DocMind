import React, { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Globe, FileText, Search, ExternalLink } from "lucide-react";

export default function ResearchStatusBar({
  researchQuery,
  sources = [],
  onOpenAllSources
}) {
  const [expanded, setExpanded] = useState(false);

  // Distinguish used vs candidate sources
  const hasExplicitFlags = sources.some((s) => s.used_in_answer !== undefined);
  const usedSources = hasExplicitFlags
    ? sources.filter((s) => s.used_in_answer === true)
    : sources;

  const displaySources = usedSources.length > 0 ? usedSources : sources;

  const webSources = displaySources.filter((s) => s.type === "web");
  const docSources = displaySources.filter((s) => s.type === "doc");

  const favicons = webSources
    .map((s) => s.favicon)
    .filter(Boolean)
    .filter((v, idx, arr) => arr.indexOf(v) === idx);

  const displayQuery = researchQuery || (sources.length > 0 ? "sources & document intelligence" : "knowledge base");

  return (
    <div className="mb-4 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all overflow-hidden">
      {/* Clickable Header Bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2.5 md:px-3 text-left group"
      >
        {/* Left: Checkmark & Query */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </div>

          <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors truncate">
            Researched <strong className="font-semibold text-white">{displayQuery}</strong>
          </span>

          <div className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Right: Stacked Favicon Avatars + count badge */}
        {sources.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <div className="flex items-center -space-x-1.5 overflow-hidden">
              {favicons.slice(0, 3).map((fav, i) => (
                <img
                  key={i}
                  src={fav}
                  alt=""
                  className="w-4 h-4 rounded-full ring-2 ring-slate-900 object-cover bg-slate-800"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ))}
              {docSources.length > 0 && favicons.length < 3 && (
                <div className="w-4 h-4 rounded-full ring-2 ring-slate-900 bg-brand-primary/20 flex items-center justify-center text-[9px] text-brand-primary font-bold">
                  <FileText className="w-2.5 h-2.5" />
                </div>
              )}
            </div>

            <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 ring-1 ring-cyan-500/30 rounded-full px-2 py-0.5">
              {usedSources.length > 0 ? `${usedSources.length} cited` : `${sources.length} sources`}
            </span>
          </div>
        )}
      </button>

      {/* Collapsible Details Drawer */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium pt-1">
            <Search className="w-3 h-3 text-brand-secondary" />
            <span>Search Query: <strong className="text-white">{displayQuery}</strong></span>
          </div>

          <div className="space-y-1 pl-4 border-l border-white/10 my-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Extracted research intent and targeted real-time sources</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Retrieved and inspected {sources.length} candidate references</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>
                {usedSources.length > 0
                  ? `Synthesized answer grounded in ${usedSources.length} verified cited sources`
                  : "Verified results (no relevant public records matched query)"}
              </span>
            </div>
          </div>

          {sources.length > 0 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {usedSources.length > 0
                  ? `${usedSources.length} Sources Cited (${sources.length} Evaluated)`
                  : `${sources.length} Sources Evaluated`}
              </span>
              {onOpenAllSources && (
                <button
                  onClick={onOpenAllSources}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium flex items-center gap-1"
                >
                  View full source details <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
