import React, { useState, useMemo } from "react";
import { Globe, FileText } from "lucide-react";

/**
 * Normalizes favicon URLs and migrates legacy Google S2 / gstatic endpoints to unavatar.io.
 * This guarantees:
 * 1. Historical chat citations stored with `google.com/s2/favicons` don't trigger 404s.
 * 2. Newly deployed, personal, or obscure domains (e.g. *.vercel.app) resolve cleanly with 200 SVG fallback.
 * 3. Empty or missing favicons are auto-resolved from the source URL's domain.
 */
export function getSafeFavicon(faviconUrl, sourceUrl) {
  // 1. Try to extract domain from sourceUrl
  let domain = "";
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl.startsWith("http") ? sourceUrl : `https://${sourceUrl}`);
      domain = parsed.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      // ignore
    }
  }

  // 2. If faviconUrl is a legacy Google S2 or gstatic URL, rewrite it to unavatar.io
  if (faviconUrl && typeof faviconUrl === "string") {
    if (faviconUrl.includes("google.com/s2/favicons") || faviconUrl.includes("gstatic.com/faviconV2")) {
      try {
        const u = new URL(faviconUrl);
        const qDomain = u.searchParams.get("domain") || u.searchParams.get("domain_url") || u.searchParams.get("url");
        if (qDomain) {
          const cleanDomain = qDomain
            .replace(/^https?:\/\//, "")
            .split("/")[0]
            .replace(/^www\./, "")
            .toLowerCase();
          if (cleanDomain) {
            return `https://unavatar.io/${cleanDomain}`;
          }
        }
      } catch {
        // fallback to domain from sourceUrl
      }
      if (domain) {
        return `https://unavatar.io/${domain}`;
      }
    }
    return faviconUrl;
  }

  // 3. If no faviconUrl provided but we have a web domain, use unavatar.io
  if (domain && !["localhost", "127.0.0.1"].includes(domain)) {
    return `https://unavatar.io/${domain}`;
  }

  return "";
}

/**
 * Resilient Favicon component for source cards and modals.
 * Renders the domain favicon, and seamlessly transitions to a Globe/FileText icon on load error.
 */
export const SourceFavicon = ({
  src,
  url,
  siteName = "",
  isWeb = true,
  className = "w-3.5 h-3.5 rounded-full object-cover shrink-0",
  fallbackClassName = "w-3.5 h-3.5 text-amber-400 shrink-0",
}) => {
  const [hasError, setHasError] = useState(false);
  const safeSrc = useMemo(() => (isWeb ? getSafeFavicon(src, url) : ""), [src, url, isWeb]);

  if (!isWeb) {
    return <FileText className={fallbackClassName} />;
  }

  if (!safeSrc || hasError) {
    return <Globe className={fallbackClassName} />;
  }

  return (
    <img
      src={safeSrc}
      alt={siteName || ""}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

/**
 * Resilient Avatar pill for stacked research status header.
 */
export const StackedFaviconAvatar = ({
  src,
  url,
  siteName = "",
}) => {
  const [hasError, setHasError] = useState(false);
  const safeSrc = useMemo(() => getSafeFavicon(src, url), [src, url]);

  if (!safeSrc || hasError) {
    return (
      <div
        className="w-4 h-4 rounded-full ring-2 ring-[#08080a] bg-amber-950/80 border border-amber-500/30 flex items-center justify-center shrink-0"
        title={siteName || "Web source"}
      >
        <Globe className="w-2.5 h-2.5 text-amber-300" />
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={siteName || ""}
      title={siteName || "Web source"}
      className="w-4 h-4 rounded-full ring-2 ring-[#08080a] object-cover bg-black shrink-0"
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

export default SourceFavicon;
