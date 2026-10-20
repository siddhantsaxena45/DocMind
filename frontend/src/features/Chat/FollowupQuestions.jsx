import React from "react";
import { CornerDownRight, Sparkles } from "lucide-react";

export default function FollowupQuestions({
  questions = [],
  onSelectQuestion,
  disabled = false
}) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-4 pt-2 space-y-2">
      <div className="flex flex-col gap-2">
        {questions.map((q, qIdx) => (
          <button
            key={qIdx}
            disabled={disabled}
            onClick={() => onSelectQuestion(q)}
            className="w-fit text-left text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] active:bg-white/[0.14] border border-white/10 hover:border-brand-primary/40 rounded-full px-4 py-2 transition-all duration-150 flex items-center gap-2.5 group disabled:opacity-50 disabled:cursor-not-allowed shadow-xs hover:shadow-sm"
          >
            {/* Curved reply arrow icon matching Perplexity ↳ */}
            <CornerDownRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-secondary transition-colors shrink-0" />
            <span className="leading-snug">{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
