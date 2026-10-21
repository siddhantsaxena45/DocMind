import logging
import re
import warnings
from urllib.parse import urlparse
from typing import List, Dict, Any, Optional
import httpx

warnings.filterwarnings("ignore", category=RuntimeWarning, message=".*duckduckgo_search.*")

try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)

SPAM_MARKETPLACE_DOMAINS = {
    "aliexpress.com", "aliexpress.us", "temu.com", "alibaba.com",
    "dhgate.com", "wish.com", "made-in-china.com", "banggood.com",
    "gearbest.com", "taobao.com"
}

def is_shopping_query(query: str) -> bool:
    q = query.lower()
    shopping_terms = ["buy", "price", "shop", "store", "purchase", "order", "discount", "coupon", "cost", "for sale"]
    return any(term in q for term in shopping_terms)

def extract_site_metadata(url: str) -> tuple[str, str]:
    """
    Returns (site_name, favicon_url)
    e.g. ("YouTube", "https://www.google.com/s2/favicons?domain=youtube.com&sz=64")
    """
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        
        # YouTube detection
        if "youtube.com" in domain or "youtu.be" in domain:
            site_name = "YouTube"
            favicon = "https://www.google.com/s2/favicons?domain=youtube.com&sz=64"
            return site_name, favicon

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

        shopping_intent = is_shopping_query(clean_query)

        # 1. Primary: DDGS python library
        try:
            with DDGS(timeout=self.timeout) as ddgs:
                ddg_gen = ddgs.text(clean_query, max_results=max_results + 4)
                for item in ddg_gen:
                    title = item.get("title", "")
                    href = item.get("href", "")
                    body = item.get("body", "")
                    if href and (title or body):
                        # Filter out spam marketplace domains unless the user explicitly wants shopping
                        parsed_href = urlparse(href)
                        d = parsed_href.netloc.lower()
                        if any(spam in d for spam in SPAM_MARKETPLACE_DOMAINS) and not shopping_intent:
                            continue
                        site_name, favicon = extract_site_metadata(href)
                        results.append({
                            "title": title or href,
                            "url": href,
                            "snippet": body[:500],
                            "site_name": site_name,
                            "favicon": favicon,
                            "type": "web"
                        })
                        if len(results) >= max_results:
                            break
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
        shopping_intent = is_shopping_query(query)
        with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
            resp = client.post(url, data=data, headers=headers)
            if resp.status_code == 200:
                from lxml import html
                tree = html.fromstring(resp.text)
                links = tree.xpath('//a[contains(@class, "result__url")]')
                titles = tree.xpath('//a[contains(@class, "result__snippet")]')
                for i in range(min(len(links), max_results + 4)):
                    href = links[i].get("href", "")
                    snippet = titles[i].text_content().strip() if i < len(titles) else ""
                    if href:
                        parsed_href = urlparse(href)
                        d = parsed_href.netloc.lower()
                        if any(spam in d for spam in SPAM_MARKETPLACE_DOMAINS) and not shopping_intent:
                            continue
                        site_name, favicon = extract_site_metadata(href)
                        results.append({
                            "title": href,
                            "url": href,
                            "snippet": snippet[:500],
                            "site_name": site_name,
                            "favicon": favicon,
                            "type": "web"
                        })
                        if len(results) >= max_results:
                            break
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

    def fetch_url_content(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Directly visits a live URL (e.g. GitHub profile/repo, portfolio, project website)
        and extracts readable text, title, and key metadata for verification.
        """
        clean_u = url.strip()
        if not clean_u.startswith("http://") and not clean_u.startswith("https://"):
            clean_u = "https://" + clean_u

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }

        try:
            with httpx.Client(timeout=6.0, follow_redirects=True, headers=headers) as client:
                resp = client.get(clean_u)
                if resp.status_code != 200:
                    return None

                html_text = resp.text
                site_name, favicon = extract_site_metadata(clean_u)

                # Extract title
                title_match = re.search(r'<title[^>]*>(.*?)</title>', html_text, re.IGNORECASE | re.DOTALL)
                title = title_match.group(1).strip() if title_match else clean_u

                # Remove scripts, styles, svg, and nav
                clean_html = re.sub(r'<(script|style|svg|nav|footer)[^>]*>.*?</\1>', ' ', html_text, flags=re.IGNORECASE | re.DOTALL)

                # Special parsing for GitHub profiles & repositories
                extracted_lines: List[str] = []
                if "github.com" in clean_u.lower():
                    repo_matches = re.findall(r'href="/[^/]+/([^/"]+)"[^>]*itemprop="name codeRepository"', clean_html)
                    if not repo_matches:
                        repo_matches = re.findall(r'<span class="repo"[^>]*>([^<]+)</span>', clean_html)
                    if repo_matches:
                        extracted_lines.append(f"Public Repositories: {', '.join(set(repo_matches[:8]))}")

                    bio_match = re.search(r'<div class="p-note user-profile-bio[^"]*"[^>]*>([\s\S]*?)</div>', clean_html)
                    if bio_match:
                        bio_text = re.sub(r'<[^>]+>', ' ', bio_match.group(1)).strip()
                        if bio_text:
                            extracted_lines.append(f"GitHub Bio: {bio_text}")

                elif "youtube.com" in clean_u.lower() or "youtu.be" in clean_u.lower():
                    desc_match = re.search(r'<meta\s+(?:name|property)=["\'](?:description|og:description)["\']\s+content=["\'](.*?)["\']', html_text, re.IGNORECASE)
                    if desc_match:
                        extracted_lines.append(f"YouTube Description: {desc_match.group(1).strip()}")
                    og_title = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\'](.*?)["\']', html_text, re.IGNORECASE)
                    if og_title:
                        title = og_title.group(1).strip()

                body_text = re.sub(r'<[^>]+>', ' ', clean_html)
                body_text = re.sub(r'\s+', ' ', body_text).strip()

                if extracted_lines:
                    snippet = " | ".join(extracted_lines) + " — " + body_text[:600]
                else:
                    snippet = body_text[:900]

                return {
                    "url": clean_u,
                    "title": title[:100],
                    "snippet": snippet,
                    "site_name": site_name,
                    "favicon": favicon,
                    "type": "web"
                }
        except Exception as e:
            logger.warning(f"Could not fetch live content for {clean_u}: {e}")
            return None

    def fetch_multiple_urls(self, urls: List[str], max_urls: int = 3) -> List[Dict[str, Any]]:
        """
        Fetches live web content from multiple target URLs in sequence.
        """
        results: List[Dict[str, Any]] = []
        seen = set()
        for u in urls:
            if not u or u.lower() in seen:
                continue
            seen.add(u.lower())
            res = self.fetch_url_content(u)
            if res:
                results.append(res)
            if len(results) >= max_urls:
                break
        return results


web_search_service = WebSearchService()


