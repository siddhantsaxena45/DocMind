import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, ExternalLink, Sparkles, Globe, FileText } from "lucide-react";

/**
 * Transforms raw citation reference tokens into interactive markdown links:
 * - [[WEB_REF_1]] -> [1](#source-card-1)
 * - [[WEB_REF_1], [WEB_REF_4]] -> [1](#source-card-1) [4](#source-card-4)
 * - [[LIVE_LINK_1]] -> [1](#source-card-1)
 * - [WEB_REF_1] -> [1](#source-card-1)
 * - [1] or [1, 2] -> [1](#source-card-1) [2](#source-card-2)
 * Shields code blocks (```...``` and `...`) so code syntax is never modified.
 */
export function formatCitationBadges(rawText) {
  if (!rawText || typeof rawText !== "string") return rawText;

  // Split by code fences (```...```) or inline code (`...`) to preserve code blocks intact
  const codeBlockRegex = /(```[\s\S]*?```|`[^`\n]+`)/g;
  const parts = rawText.split(codeBlockRegex);

  return parts
    .map((part, index) => {
      // Odd indices are code blocks - leave them strictly untouched
      if (index % 2 === 1) {
        return part;
      }

      // 1. Match compound/nested citations containing WEB_REF_ or LIVE_LINK_
      // e.g. [[WEB_REF_1], [WEB_REF_4]], [[WEB_REF_1]], [WEB_REF_1], [[LIVE_LINK_1]]
      let formatted = part.replace(
        /(?<!\w)\[+[\s\[]*(?:WEB_REF_|LIVE_LINK_)\d+[^\]]*?\]+(?!\s*\()/gi,
        (match) => {
          const nums = match.match(/\d+/g);
          if (!nums || nums.length === 0) return match;
          const uniqueNums = [...new Set(nums)];
          return uniqueNums.map((n) => `[${n}](#source-card-${n})`).join(" ");
        }
      );

      // 2. Fallback for any standalone [[WEB_REF_X]] or [WEB_REF_X]
      formatted = formatted.replace(
        /\[\[?(?:WEB_REF_|LIVE_LINK_)(\d+)\]?\](?!\s*\()/gi,
        (match, num) => `[${num}](#source-card-${num})`
      );

      // 3. Match standalone bracketed citations like [1] or [1, 2] not followed by (
      // Limit to 1 or 2 digit citations (e.g. [1] up to [99]) to avoid matching arbitrary brackets
      formatted = formatted.replace(
        /(?<![\w\[])\[(\d{1,2}(?:\s*,\s*\d{1,2})*)\](?!\s*[\(\[])/g,
        (match, inner) => {
          const nums = inner.match(/\d+/g);
          if (!nums || nums.length === 0) return match;
          const uniqueNums = [...new Set(nums)];
          return uniqueNums.map((n) => `[${n}](#source-card-${n})`).join(" ");
        }
      );

      return formatted;
    })
    .join("");
}

/**
 * Renders citation badges [1], [2] or styled links.
 */
function renderCitationLink(href, children) {
  const text = String(children || "").trim();
  const citeMatch = text.match(/^(?:\[?WEB_REF_)?(\d+)\]?$/i) || text.match(/^\[?LIVE_LINK_(\d+)\]?$/i);
  const cardMatch = href && href.match(/^#source-card-(\d+)$/i);

  if (citeMatch || cardMatch) {
    const num = (cardMatch && cardMatch[1]) || (citeMatch && citeMatch[1]);
    const isInternalCard = href && href.startsWith("#source-card-");

    return (
      <a
        href={href || `#source-card-${num}`}
        target={href && href.startsWith("http") ? "_blank" : "_self"}
        rel="noopener noreferrer"
        onClick={(e) => {
          const card = document.getElementById(`source-card-${num}`);
          if (card) {
            e.preventDefault();
            card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            card.classList.add("ring-2", "ring-cyan-400", "shadow-lg", "shadow-cyan-500/20");
            setTimeout(() => {
              card.classList.remove("ring-2", "ring-cyan-400", "shadow-lg", "shadow-cyan-500/20");
            }, 2500);
          } else if (isInternalCard) {
            e.preventDefault();
          }
        }}
        className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 mx-0.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-100 border border-cyan-500/40 text-[10px] font-bold font-mono transition-all no-underline shadow-xs hover:scale-110 align-baseline cursor-pointer"
        title={href && !isInternalCard ? href : `Source [${num}]`}
      >
        {num}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-medium break-all"
    >
      <span>{children}</span>
      <ExternalLink className="w-2.5 h-2.5 inline shrink-0 opacity-70" />
    </a>
  );
}

/**
 * Parses inline markdown for table cells (bold, links, code, italic).
 */
function InlineCell({ text }) {
  if (!text) return null;
  const formatted = formatCitationBadges(text);
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <span>{children}</span>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
        code: ({ children }) => (
          <code className="bg-white/10 px-1 py-0.5 rounded text-[11px] font-mono text-cyan-300">
            {children}
          </code>
        ),
        a: ({ href, children }) => renderCitationLink(href, children)
      }}
    >
      {formatted}
    </ReactMarkdown>
  );
}

/**
 * Splits raw markdown content into normal markdown blocks and pipe-table blocks.
 */
function splitMarkdownBlocks(raw) {
  if (!raw) return [];
  const lines = raw.split("\n");
  const blocks = [];
  let currentMdLines = [];
  let currentTable = null;

  const isTableRow = (l) => {
    const t = l.trim();
    return t.startsWith("|") && t.endsWith("|") && t.length > 2;
  };

  const isSeparator = (l) => {
    const t = l.trim();
    return /^\|(?:\s*:?-+:?\s*\|)+$/.test(t);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isTableRow(line)) {
      if (currentTable) {
        if (!isSeparator(line)) {
          const cells = line.split("|").slice(1, -1).map((c) => c.trim());
          currentTable.rows.push(cells);
        }
      } else if (i + 1 < lines.length && isSeparator(lines[i + 1])) {
        // Table starting
        if (currentMdLines.length > 0) {
          blocks.push({ type: "markdown", text: currentMdLines.join("\n") });
          currentMdLines = [];
        }
        const headers = line.split("|").slice(1, -1).map((c) => c.trim());
        currentTable = { type: "table", headers, rows: [] };
        i++; // skip separator line
      } else {
        currentMdLines.push(line);
      }
    } else {
      if (currentTable) {
        blocks.push(currentTable);
        currentTable = null;
      }
      currentMdLines.push(line);
    }
  }

  if (currentTable) {
    blocks.push(currentTable);
  }
  if (currentMdLines.length > 0) {
    blocks.push({ type: "markdown", text: currentMdLines.join("\n") });
  }

  return blocks;
}

export default function MarkdownTableRenderer({ content, messageIdx = 0 }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopyCode = (code, key) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!content) return null;

  const formattedContent = formatCitationBadges(content);
  const blocks = splitMarkdownBlocks(formattedContent);

  return (
    <div className="space-y-4 text-xs md:text-sm leading-relaxed text-slate-200">
      {blocks.map((block, bIdx) => {
        if (block.type === "table") {
          return (
            <div
              key={bIdx}
              className="overflow-x-auto my-4 rounded-2xl border border-white/10 bg-slate-950/60 shadow-xl custom-scrollbar"
            >
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04]">
                    {block.headers.map((header, hIdx) => (
                      <th
                        key={hIdx}
                        className="py-3 px-4 font-bold text-white tracking-wide first:pl-5 last:pr-5"
                      >
                        <InlineCell text={header} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {block.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="py-3 px-4 text-slate-300 leading-relaxed first:pl-5 last:pr-5 first:font-medium first:text-slate-200"
                        >
                          <InlineCell text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Standard Markdown Block
        return (
          <div key={bIdx} className="prose prose-invert prose-sm max-w-none space-y-3">
            <ReactMarkdown
              components={{
                h2({ children }) {
                  return (
                    <h2 className="text-base md:text-lg font-bold text-white tracking-tight mt-5 mb-2.5">
                      {children}
                    </h2>
                  );
                },
                h3({ children }) {
                  return (
                    <h3 className="text-sm md:text-base font-semibold text-white tracking-tight mt-4 mb-2">
                      {children}
                    </h3>
                  );
                },
                strong({ children }) {
                  return <strong className="font-semibold text-white">{children}</strong>;
                },
                ul({ children }) {
                  return <ul className="space-y-1.5 my-2.5 pl-4 list-disc marker:text-brand-secondary">{children}</ul>;
                },
                li({ children }) {
                  return <li className="text-slate-300 leading-relaxed">{children}</li>;
                },
                p({ children }) {
                  // Check if this paragraph is a "Key takeaway" callout
                  const text = String(children);
                  if (text.includes("Key takeaway:") || text.includes("Key Takeaway:")) {
                    return (
                      <div className="my-3 p-3.5 rounded-xl bg-linear-to-r from-brand-primary/10 via-brand-secondary/10 to-transparent border-l-4 border-brand-primary border-y border-r border-white/5 text-slate-200">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
                          <div className="text-xs md:text-sm leading-relaxed">{children}</div>
                        </div>
                      </div>
                    );
                  }
                  return <p className="leading-relaxed my-2">{children}</p>;
                },
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");
                  const codeKey = `code_${messageIdx}_${bIdx}_${match ? match[1] : "txt"}`;

                  return !inline && match ? (
                    <div className="rounded-xl overflow-hidden my-3 border border-white/10 shadow-lg">
                      <div className="bg-slate-950 px-3.5 py-1.5 text-[11px] font-mono text-slate-400 border-b border-white/10 flex justify-between items-center">
                        <span className="text-cyan-400 font-semibold">{match[1]}</span>
                        <button
                          onClick={() => handleCopyCode(codeString, codeKey)}
                          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                        >
                          {copiedKey === codeKey ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[10px] text-emerald-400 font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={atomDark}
                        language={match[1]}
                        PreTag="div"
                        className="!m-0 !bg-slate-950/90 !p-3.5 text-xs font-mono"
                        {...props}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-300" {...props}>
                      {children}
                    </code>
                  );
                },
                a: ({ href, children }) => renderCitationLink(href, children)
              }}
            >
              {block.text}
            </ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}
