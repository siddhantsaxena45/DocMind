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
        self.timeout = 4.0

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
        import urllib.parse
        try:
            with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
                resp = client.post(url, data=data, headers=headers)
                if resp.status_code == 200:
                    from lxml import html
                    tree = html.fromstring(resp.text)
                    result_elements = tree.xpath('//div[contains(@class, "result")]')
                    for elem in result_elements:
                        t_elem = elem.xpath('.//h2/a')
                        s_elem = elem.xpath('.//a[contains(@class, "result__snippet")]')
                        if not t_elem:
                            continue
                        real_title = t_elem[0].text_content().strip()
                        raw_href = t_elem[0].get("href", "")
                        if not raw_href or "duckduckgo.com/y.js" in raw_href:
                            continue

                        # Decode real target URL from DuckDuckGo redirect wrapper /l/?uddg=<url>
                        if "uddg=" in raw_href:
                            parsed_qs = urllib.parse.parse_qs(urllib.parse.urlparse(raw_href).query)
                            real_href = parsed_qs.get("uddg", [raw_href])[0]
                        else:
                            real_href = raw_href

                        if not real_href.startswith("http"):
                            continue

                        parsed_href = urlparse(real_href)
                        d = parsed_href.netloc.lower()
                        if any(spam in d for spam in SPAM_MARKETPLACE_DOMAINS) and not shopping_intent:
                            continue

                        snippet = s_elem[0].text_content().strip() if s_elem else ""
                        site_name, favicon = extract_site_metadata(real_href)
                        results.append({
                            "title": real_title or real_href,
                            "url": real_href,
                            "snippet": snippet[:500],
                            "site_name": site_name,
                            "favicon": favicon,
                            "type": "web"
                        })
                        if len(results) >= max_results:
                            break
        except Exception as e:
            logger.warning(f"HTML fallback search error: {e}")

        return results

    def search_multi(self, queries: List[str], max_results: int = 8) -> List[Dict[str, Any]]:
        """
        Executes web searches across multiple targeted queries and merges results,
        deduplicating by URL to provide diverse, rich verification sources.
        """
        merged_results: List[Dict[str, Any]] = []
        seen_urls = set()

        for idx, q in enumerate(queries):
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
            # If search engine is timing out / blocked on datacenter IP, don't cascade 3 timeouts
            if not sub_results and not merged_results and idx >= 1:
                break

        return merged_results

    def fetch_url_content(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Directly visits and scrapes live web pages (Wikipedia, news articles, tech documentation,
        blogs, GitHub repos, YouTube channels, official sites) to extract in-depth readable content.
        """
        clean_u = url.strip()
        if not clean_u.startswith("http://") and not clean_u.startswith("https://"):
            clean_u = "https://" + clean_u

        site_name, favicon = extract_site_metadata(clean_u)

        # 1. Specialized Wikipedia Handler (Instant, authoritative, structured encyclopedic extract)
        if "wikipedia.org/wiki/" in clean_u:
            try:
                title_slug = clean_u.split("/wiki/")[-1].split("#")[0].split("?")[0]
                api_u = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title_slug}"
                with httpx.Client(timeout=4.0) as client:
                    w_resp = client.get(api_u, headers={"User-Agent": "DocMindResearchApp/1.0 (info@docmind.ai)"})
                    if w_resp.status_code == 200:
                        w_data = w_resp.json()
                        extract = w_data.get("extract", "")
                        w_title = w_data.get("title") or "Wikipedia"
                        if extract:
                            return {
                                "url": clean_u,
                                "title": f"{w_title} - Wikipedia",
                                "snippet": extract[:1800],
                                "site_name": "Wikipedia",
                                "favicon": favicon or "https://www.google.com/s2/favicons?domain=wikipedia.org&sz=64",
                                "type": "web"
                            }
            except Exception as e:
                logger.debug(f"Wikipedia API lookup fallback: {e}")

        # 2. Universal Browser Scraping for All Web Sources
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"
        }

        try:
            with httpx.Client(timeout=5.0, follow_redirects=True, headers=headers) as client:
                resp = client.get(clean_u)
                if resp.status_code != 200 or not resp.text:
                    return None

                html_text = resp.text
                from lxml import html
                tree = html.fromstring(html_text)

                # Remove non-content / boilerplate elements
                for tag in tree.xpath('//script | //style | //nav | //footer | //header | //aside | //noscript | //form | //svg'):
                    tag.drop_tree()

                # Title extraction
                title_elem = tree.xpath('//title')
                title = title_elem[0].text_content().strip() if title_elem else clean_u
                title = re.sub(r'\s+', ' ', title).strip()

                # Specialized parsing for GitHub
                if "github.com" in clean_u.lower():
                    repo_matches = tree.xpath('//a[@itemprop="name codeRepository"]/text()')
                    bio_matches = tree.xpath('//div[contains(@class, "user-profile-bio")]/text()')
                    readme_matches = tree.xpath('//article[contains(@class, "markdown-body")]//p/text()')
                    extracted = []
                    if bio_matches:
                        extracted.append("Bio: " + " ".join(bio_matches).strip())
                    if repo_matches:
                        extracted.append("Repositories: " + ", ".join(repo_matches[:8]).strip())
                    if readme_matches:
                        extracted.append("README: " + " ".join(readme_matches[:3]).strip())
                    if extracted:
                        return {
                            "url": clean_u,
                            "title": title[:100],
                            "snippet": (" | ".join(extracted))[:1800],
                            "site_name": site_name,
                            "favicon": favicon,
                            "type": "web"
                        }

                # Specialized parsing for YouTube
                if "youtube.com" in clean_u.lower() or "youtu.be" in clean_u.lower():
                    desc_match = re.search(r'<meta\s+(?:name|property)=["\'](?:description|og:description)["\']\s+content=["\'](.*?)["\']', html_text, re.IGNORECASE)
                    desc_text = desc_match.group(1).strip() if desc_match else ""
                    return {
                        "url": clean_u,
                        "title": title[:100],
                        "snippet": desc_text[:1500] if desc_text else "YouTube Channel / Video",
                        "site_name": site_name,
                        "favicon": favicon,
                        "type": "web"
                    }

                # General Website / Article Extraction (News, Docs, Blogs, Portals)
                # Look for semantic content containers first
                main_nodes = tree.xpath('//article | //main | //*[@role="main"] | //div[contains(@class, "article")] | //div[contains(@class, "content")] | //div[contains(@class, "post")]')
                target = main_nodes[0] if main_nodes else tree

                # Extract headings, informative paragraphs, and data tables
                headings = [h.text_content().strip() for h in target.xpath('.//h1 | .//h2 | .//h3') if len(h.text_content().strip()) > 5]
                paragraphs = [p.text_content().strip() for p in target.xpath('.//p | .//li') if len(p.text_content().strip()) > 35]

                # Extract data tables (benchmarks, specs, pricing, comparisons)
                table_rows = []
                for tr in target.xpath('.//table//tr')[:6]:
                    cells = [re.sub(r'\s+', ' ', c.text_content()).strip() for c in tr.xpath('.//th | .//td') if c.text_content().strip()]
                    if cells:
                        table_rows.append(" | ".join(cells[:6]))

                content_parts = []
                if headings:
                    content_parts.append("Key Sections: " + " • ".join(headings[:5]))
                if paragraphs:
                    content_parts.append("\n".join(paragraphs[:8]))
                else:
                    raw_body = re.sub(r'\s+', ' ', target.text_content()).strip()
                    content_parts.append(raw_body[:1400])

                if table_rows:
                    content_parts.append("Data & Tables:\n" + "\n".join(table_rows))

                snippet = "\n".join(content_parts)
                snippet = re.sub(r'\s+', ' ', snippet).strip()

                if len(snippet) < 40:
                    return None

                return {
                    "url": clean_u,
                    "title": title[:120],
                    "snippet": snippet[:2000],
                    "site_name": site_name,
                    "favicon": favicon,
                    "type": "web"
                }
        except Exception as e:
            logger.debug(f"Live web scrape for {clean_u} failed: {e}")
            return None

    def fetch_multiple_urls(self, urls: List[str], max_urls: int = 5) -> List[Dict[str, Any]]:
        """
        Fetches live web content from multiple target URLs in PARALLEL.
        Extracts rich article text from top distinct websites in ~1 second.
        """
        from concurrent.futures import ThreadPoolExecutor
        results: List[Dict[str, Any]] = []
        seen = set()
        clean_candidates = []

        for u in urls:
            if not u:
                continue
            u_clean = u.strip()
            if u_clean.lower() in seen or any(spam in u_clean.lower() for spam in SPAM_MARKETPLACE_DOMAINS):
                continue
            seen.add(u_clean.lower())
            clean_candidates.append(u_clean)
            if len(clean_candidates) >= max_urls:
                break

        if not clean_candidates:
            return results

        try:
            with ThreadPoolExecutor(max_workers=min(len(clean_candidates), 5)) as executor:
                scraped = list(executor.map(self.fetch_url_content, clean_candidates))
                for item in scraped:
                    if item and item.get("snippet"):
                        results.append(item)
        except Exception as e:
            logger.warning(f"Parallel URL fetching error: {e}")

        return results


web_search_service = WebSearchService()


