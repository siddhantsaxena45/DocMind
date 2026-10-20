import logging
import re
from urllib.parse import urlparse
from typing import List, Dict, Any, Optional
import httpx

try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)

def extract_site_metadata(url: str) -> tuple[str, str]:
    """
    Returns (site_name, favicon_url)
    e.g. ("r/Twitch", "https://www.google.com/s2/favicons?domain=reddit.com&sz=64")
    """
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        
        # Subreddit detection
        if "reddit.com" in domain:
            match = re.search(r"/r/([a-zA-Z0-9_]+)", parsed.path)
            if match:
                site_name = f"r/{match.group(1)}"
            else:
                site_name = "reddit.com"
        else:
            site_name = domain

        favicon = f"https://www.google.com/s2/favicons?domain={domain}&sz=64"
        return site_name, favicon
    except Exception:
        return "Web", ""

class WebSearchService:
    def __init__(self):
        self.max_results = 6
        self.timeout = 8.0

    def search(self, query: str, max_results: int = 6) -> List[Dict[str, Any]]:
        """
        Executes a web search using DuckDuckGo with fallback mechanisms.
        Returns a list of dicts with rich metadata for Perplexity-style source cards.
        """
        results: List[Dict[str, Any]] = []
        clean_query = query.strip()
        if not clean_query:
            return results

        # 1. Primary: DDGS python library
        try:
            with DDGS(timeout=self.timeout) as ddgs:
                ddg_gen = ddgs.text(clean_query, max_results=max_results)
                for item in ddg_gen:
                    title = item.get("title", "")
                    href = item.get("href", "")
                    body = item.get("body", "")
                    if href and (title or body):
                        site_name, favicon = extract_site_metadata(href)
                        results.append({
                            "title": title or href,
                            "url": href,
                            "snippet": body[:500],
                            "site_name": site_name,
                            "favicon": favicon,
                            "type": "web"
                        })
            if results:
                return results
        except Exception as e:
            logger.warning(f"DuckDuckGo search error: {e}. Attempting fallback...")

        # 2. Fallback: DuckDuckGo HTML / API fallback via httpx
        try:
            fallback_results = self._fallback_html_search(clean_query, max_results)
            if fallback_results:
                return fallback_results
        except Exception as e:
            logger.error(f"Fallback web search also failed: {e}")

        return results

    def _fallback_html_search(self, query: str, max_results: int = 6) -> List[Dict[str, Any]]:
        url = "https://html.duckduckgo.com/html/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        data = {"q": query}
        results = []
        with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
            resp = client.post(url, data=data, headers=headers)
            if resp.status_code == 200:
                from lxml import html
                tree = html.fromstring(resp.text)
                links = tree.xpath('//a[contains(@class, "result__url")]')
                titles = tree.xpath('//a[contains(@class, "result__snippet")]')
                for i in range(min(len(links), max_results)):
                    href = links[i].get("href", "")
                    snippet = titles[i].text_content().strip() if i < len(titles) else ""
                    if href:
                        site_name, favicon = extract_site_metadata(href)
                        results.append({
                            "title": href,
                            "url": href,
                            "snippet": snippet[:500],
                            "site_name": site_name,
                            "favicon": favicon,
                            "type": "web"
                        })
        return results

    def search_multi(self, queries: List[str], max_results: int = 8) -> List[Dict[str, Any]]:
        """
        Executes web searches across multiple targeted queries and merges results,
        deduplicating by URL to provide diverse, rich verification sources.
        """
        merged_results: List[Dict[str, Any]] = []
        seen_urls = set()

        for q in queries:
            if not q.strip():
                continue
            sub_results = self.search(q.strip(), max_results=4)
            for item in sub_results:
                url = item.get("url", "").rstrip("/")
                if url and url.lower() not in seen_urls:
                    seen_urls.add(url.lower())
                    merged_results.append(item)
                    if len(merged_results) >= max_results:
                        break
            if len(merged_results) >= max_results:
                break

        return merged_results


web_search_service = WebSearchService()

