import logging
import json
import re
import urllib.parse
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

FINANCIAL_TICKER_DOMAINS = {
    "stockanalysis.com", "marketwatch.com", "investing.com",
    "seekingalpha.com", "macrotrends.net", "zacks.com",
    "fool.com", "finviz.com", "barchart.com", "tipranks.com",
    "gurufocus.com", "tradingview.com", "finance.yahoo.com"
}

def is_shopping_query(query: str) -> bool:
    q = query.lower()
    shopping_terms = ["buy", "price", "shop", "store", "purchase", "order", "discount", "coupon", "cost", "for sale"]
    return any(term in q for term in shopping_terms)

def is_financial_query(query: str) -> bool:
    q = query.lower()
    financial_terms = [
        "stock", "ticker", "shares", "share price", "stock price", "market cap",
        "earnings", "quarterly", "dividend", "nasdaq", "nyse", "bvl:", "balance sheet",
        "pe ratio", "p/e", "investor relations", "annual report", "financial performance"
    ]
    return any(term in q for term in financial_terms)

def is_result_relevant(title: str, snippet: str, url: str, query: str) -> bool:
    """
    Guards against search engine fallback hallucinations (e.g. DuckDuckGo falling back to
    Delhi Capitals cricket or random hardware when searching for a coding channel).
    Checks that the result matches at least one substantive token from the query.
    """
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
        'is', 'are', 'was', 'were', 'it', 'its', 'from', 'as', 'about', 'tell', 'show',
        'search', 'youtube', 'channel', 'video', 'videos', 'online', 'web', 'page', 'site',
        'check', 'find', 'who', 'what', 'where', 'how', 'when', 'does', 'official', 'link'
    }
    q_words = [
        w.lower() for w in re.findall(r'[a-zA-Z0-9]+', query)
        if len(w) > 2 and w.lower() not in stop_words
    ]
    if not q_words:
        return True

    combined = f"{title} {snippet} {url}".lower()
    return any(w in combined for w in q_words)

def extract_site_metadata(url: str) -> tuple[str, str]:
    """
    Returns (site_name, favicon_url)
    Uses unavatar.io to resolve high-res favicons with automatic SVG fallback,
    preventing 404 network errors associated with legacy Google S2.
    """
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        
        # YouTube detection
        if "youtube.com" in domain or "youtu.be" in domain:
            site_name = "YouTube"
            favicon = "https://unavatar.io/youtube.com"
            return site_name, favicon

        # Kick detection
        if "kick.com" in domain:
            site_name = "Kick"
            favicon = "https://unavatar.io/kick.com"
            return site_name, favicon

        # Twitch detection
        if "twitch.tv" in domain:
            site_name = "Twitch"
            favicon = "https://unavatar.io/twitch.tv"
            return site_name, favicon

        # GitHub detection
        if "github.com" in domain:
            site_name = "GitHub"
            favicon = "https://unavatar.io/github.com"
            return site_name, favicon

        # Wikipedia detection
        if "wikipedia.org" in domain:
            site_name = "Wikipedia"
            favicon = "https://unavatar.io/wikipedia.org"
            return site_name, favicon

        # Twitter / X detection
        if "twitter.com" in domain or "x.com" in domain:
            site_name = "X (Twitter)"
            favicon = "https://unavatar.io/x.com"
            return site_name, favicon

        # LinkedIn detection
        if "linkedin.com" in domain:
            site_name = "LinkedIn"
            favicon = "https://unavatar.io/linkedin.com"
            return site_name, favicon

        # Subreddit detection
        if "reddit.com" in domain:
            match = re.search(r"/r/([a-zA-Z0-9_]+)", parsed.path)
            if match:
                site_name = f"r/{match.group(1)}"
            else:
                site_name = "reddit.com"
            return site_name, "https://unavatar.io/reddit.com"
        else:
            site_name = domain

        favicon = f"https://unavatar.io/{domain}" if domain else ""
        return site_name, favicon
    except Exception:
        return "Web", ""

class WebSearchService:
    def __init__(self):
        self.max_results = 6
        self.timeout = 2.5
        self._ddgs_cooldown_active = False

    def search(self, query: str, max_results: int = 6) -> List[Dict[str, Any]]:
        """
        Executes a resilient multi-backend web search.
        Gracefully handles datacenter IP rate limits (Render/AWS) by preventing
        unresponsive Mojeek fallback loops and cascading across Bing HTML, Google News RSS,
        and DuckDuckGo Lite.
        """
        results: List[Dict[str, Any]] = []
        clean_query = query.strip()
        if not clean_query:
            return results

        shopping_intent = is_shopping_query(clean_query)
        financial_intent = is_financial_query(clean_query)

        # 1. Primary: DDGS python library with explicit reliable backends (Bing, Brave, DuckDuckGo)
        # We explicitly exclude 'mojeek' to prevent Render/cloud IP timeouts
        if not getattr(self, "_ddgs_cooldown_active", False):
            try:
                with DDGS(timeout=self.timeout) as ddgs:
                    try:
                        # deedy5/ddgs accepts comma-separated backends without mojeek
                        ddg_gen = ddgs.text(clean_query, max_results=max_results + 4, backend="bing,brave,duckduckgo")
                    except (TypeError, ValueError):
                        # Fallback for older duckduckgo_search library
                        ddg_gen = ddgs.text(clean_query, max_results=max_results + 4)

                    for item in ddg_gen:
                        title = item.get("title", "")
                        href = item.get("href", "")
                        body = item.get("body", "")
                        if href and (title or body):
                            parsed_href = urlparse(href)
                            d = parsed_href.netloc.lower()
                            # Filter out spam marketplace domains unless the user explicitly wants shopping
                            if any(spam in d for spam in SPAM_MARKETPLACE_DOMAINS) and not shopping_intent:
                                continue
                            # Filter out financial ticker aggregator domains unless query is financial
                            if any(ticker in d for ticker in FINANCIAL_TICKER_DOMAINS) and not financial_intent:
                                continue
                            # Filter out search engine fallback hallucinations that have zero match with query terms
                            if not is_result_relevant(title, body, href, clean_query):
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
                self._ddgs_cooldown_active = True
                logger.info(f"DDGS search backend rate-limited/slow on datacenter IP ({type(e).__name__}). Cascading to multi-engine fallbacks...")
                logger.debug(f"DDGS error detail: {e}")

        # 2. Fast Fallback Engine 1: Direct Bing Web Search HTML (Reliable on cloud IPs)
        try:
            bing_results = self.search_bing_html(clean_query, max_results=max_results)
            if bing_results:
                return bing_results
        except Exception as e:
            logger.debug(f"Bing fallback search error: {e}")

        # 3. Fast Fallback Engine 2: Google News RSS (Zero rate-limit on datacenter IPs)
        try:
            news_results = self.search_google_news(clean_query, max_results=max_results)
            if news_results:
                return news_results
        except Exception as e:
            logger.debug(f"Google News fallback search error: {e}")

        # 4. Fallback Engine 3: DuckDuckGo Lite HTML
        try:
            lite_results = self._fallback_lite_search(clean_query, max_results=max_results)
            if lite_results:
                return lite_results
        except Exception as e:
            logger.debug(f"DuckDuckGo Lite fallback error: {e}")

        # 5. Fallback Engine 4: DuckDuckGo standard HTML fallback via httpx
        try:
            fallback_results = self._fallback_html_search(clean_query, max_results=max_results)
            if fallback_results:
                return fallback_results
        except Exception as e:
            logger.debug(f"DuckDuckGo standard HTML fallback error: {e}")

        return results

    def _fallback_html_search(self, query: str, max_results: int = 6) -> List[Dict[str, Any]]:
        url = "https://html.duckduckgo.com/html/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        data = {"q": query}
        results = []
        shopping_intent = is_shopping_query(query)
        financial_intent = is_financial_query(query)
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
                        if any(ticker in d for ticker in FINANCIAL_TICKER_DOMAINS) and not financial_intent:
                            continue

                        snippet = s_elem[0].text_content().strip() if s_elem else ""
                        # Filter out search engine fallback hallucinations that have zero match with query terms
                        if not is_result_relevant(real_title, snippet, real_href, query):
                            continue
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
            logger.debug(f"HTML fallback search error: {e}")

        return results

    def search_multi(self, queries: List[str], max_results: int = 8) -> List[Dict[str, Any]]:
        """
        Executes web searches across multiple targeted queries and merges results,
        deduplicating by URL to provide diverse, rich verification sources.
        Generalizes across Kick, Twitch, GitHub, Reddit, Wikipedia, YouTube, and the open web.
        """
        merged_results: List[Dict[str, Any]] = []
        seen_urls = set()
        self._ddgs_cooldown_active = False

        combined_q = (" ".join(queries)).lower()
        has_kick = any(k in combined_q for k in ["kick", "kick.com"])
        has_github = any(g in combined_q for g in ["github", "github.com", "repo", "repository"])
        has_reddit = any(r in combined_q for r in ["reddit", "subreddit", "r/"])
        has_yt = any(y in combined_q for y in ["youtube", "youtuber", "youtu.be"])

        # 1. Proactively query specialized platforms when targeted intent is detected
        if has_kick:
            clean_target = re.sub(r'[\'"]', '', queries[0]).replace("site:kick.com", "").replace("kick", "").replace("streamer", "").replace("stream", "").strip()
            kick_hits = self.search_kick(clean_target or queries[0], max_results=3)
            for item in kick_hits:
                url = item.get("url", "").rstrip("/")
                if url and url.lower() not in seen_urls:
                    seen_urls.add(url.lower())
                    merged_results.append(item)

        if has_github:
            clean_target = re.sub(r'[\'"]', '', queries[0]).replace("site:github.com", "").replace("github", "").replace("repo", "").strip()
            gh_hits = self.search_github(clean_target or queries[0], max_results=3)
            for item in gh_hits:
                url = item.get("url", "").rstrip("/")
                if url and url.lower() not in seen_urls:
                    seen_urls.add(url.lower())
                    merged_results.append(item)

        if has_reddit:
            clean_target = re.sub(r'[\'"]', '', queries[0]).replace("site:reddit.com", "").replace("reddit", "").strip()
            rd_hits = self.search_reddit(clean_target or queries[0], max_results=3)
            for item in rd_hits:
                url = item.get("url", "").rstrip("/")
                if url and url.lower() not in seen_urls:
                    seen_urls.add(url.lower())
                    merged_results.append(item)

        # 2. Standard Web Search across queries (DuckDuckGo primary)
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

        # 3. Fallback cascade if search engines timed out / returned 0 hits
        if not merged_results and queries:
            # A. Try Bing HTML general web search first
            bing_hits = self.search_bing_html(queries[0], max_results=max_results)
            for item in bing_hits:
                url = item.get("url", "").rstrip("/")
                if url and url.lower() not in seen_urls:
                    seen_urls.add(url.lower())
                    merged_results.append(item)

        # 4. Secondary fallback: Platform-specific direct searches
        if len(merged_results) < 2 and queries:
            if has_kick:
                kick_hits = self.search_kick(queries[0], max_results=3)
                for item in kick_hits:
                    url = item.get("url", "").rstrip("/")
                    if url and url.lower() not in seen_urls:
                        seen_urls.add(url.lower())
                        merged_results.append(item)
            elif has_yt:
                clean_target = re.sub(r'[\'"]', '', queries[0]).replace("youtube", "").replace("channel", "").strip()
                yt_results = self.search_youtube(clean_target or queries[0], max_results=max_results)
                for item in yt_results:
                    url = item.get("url", "").rstrip("/")
                    if url and url.lower() not in seen_urls:
                        seen_urls.add(url.lower())
                        merged_results.append(item)
            else:
                wiki_hits = self.search_wikipedia(queries[0], max_results=2)
                for item in wiki_hits:
                    url = item.get("url", "").rstrip("/")
                    if url and url.lower() not in seen_urls:
                        seen_urls.add(url.lower())
                        merged_results.append(item)

        return merged_results

    def search_kick(self, query: str, max_results: int = 3) -> List[Dict[str, Any]]:
        """
        Directly checks Kick channel profiles to bypass search engine rate limits.
        Extracts verified Kick streamer metadata, follower count, and bio.
        """
        results = []
        clean_q = re.sub(r'[\'"]', '', query).lower()
        clean_q = re.sub(r'\bsite:kick\.com\b', '', clean_q)
        for term in ["kick", "streamer", "stream", "creator", "live", "indian", "official", "watch"]:
            clean_q = re.sub(rf'\b{term}\b', '', clean_q)
        clean_q = clean_q.strip()
        tokens = [t for t in re.split(r'[\s_]+', clean_q) if t]
        candidate_slugs = []
        if tokens:
            candidate_slugs.append("".join(tokens))
            if len(tokens) > 1:
                candidate_slugs.append(tokens[0])

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json, text/html, */*",
            "Accept-Language": "en-US,en;q=0.9"
        }

        for slug in candidate_slugs[:2]:
            slug = slug.strip("/").lower()
            if not slug or len(slug) < 3 or slug in ["search", "categories", "video", "clips"]:
                continue
            channel_url = f"https://kick.com/{slug}"
            try:
                api_url = f"https://kick.com/api/v2/channels/{slug}"
                with httpx.Client(timeout=3.5, follow_redirects=True, headers=headers) as client:
                    resp = client.get(api_url)
                    if resp.status_code == 200:
                        try:
                            data = resp.json()
                            u_data = data.get("user", {})
                            bio = u_data.get("bio", "") or data.get("chatroom", {}).get("description", "")
                            followers = data.get("followers_count") or data.get("followersCount") or ""
                            livestream = data.get("livestream")
                            live_str = " (Currently LIVE)" if livestream else ""
                            f_str = f" | {followers:,} followers" if isinstance(followers, int) and followers > 0 else ""
                            
                            results.append({
                                "title": f"{slug.title()} - Kick Live Stream",
                                "url": channel_url,
                                "snippet": f"Official Kick Channel: {slug}. Verified Kick Creator{live_str}{f_str}. Bio: {bio}".strip(),
                                "site_name": "Kick",
                                "favicon": "https://unavatar.io/kick.com",
                                "type": "web"
                            })
                            if len(results) >= max_results:
                                return results
                        except Exception:
                            pass

                    # HTML fallback
                    page_resp = client.get(channel_url)
                    if page_resp.status_code == 200 and "kick" in page_resp.text.lower():
                        from lxml import html
                        tree = html.fromstring(page_resp.text)
                        title_el = tree.xpath('//title')
                        t_text = title_el[0].text_content().strip() if title_el else f"{slug.title()} on Kick"
                        desc_match = re.search(r'<meta\s+(?:name|property)=["\'](?:description|og:description)["\']\s+content=["\'](.*?)["\']', page_resp.text, re.IGNORECASE)
                        desc_text = desc_match.group(1).strip() if desc_match else f"Watch {slug} live stream on Kick."
                        
                        results.append({
                            "title": t_text[:90],
                            "url": channel_url,
                            "snippet": f"Official Kick Channel for {slug}: {desc_text}".strip(),
                            "site_name": "Kick",
                            "favicon": "https://unavatar.io/kick.com",
                            "type": "web"
                        })
                        if len(results) >= max_results:
                            return results
            except Exception as e:
                logger.debug(f"Direct Kick channel check for {slug} error: {e}")

        return results

    def search_bing_html(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Lightweight Bing HTML search fallback for general web results across all domains
        when DuckDuckGo is blocked or times out on cloud datacenter IPs.
        """
        clean_q = re.sub(r'[\'"]', '', query).strip()
        encoded = urllib.parse.quote_plus(clean_q)
        url = f"https://www.bing.com/search?q={encoded}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"
        }
        results = []
        try:
            with httpx.Client(timeout=3.5, follow_redirects=True, headers=headers) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    try:
                        from lxml import html
                        tree = html.fromstring(resp.text)
                        items = tree.xpath('//li[contains(@class, "b_algo")]')
                        for item in items:
                            t_nodes = item.xpath('.//h2/a')
                            if not t_nodes:
                                continue
                            t_text = t_nodes[0].text_content().strip()
                            href = t_nodes[0].get("href", "")
                            if not href or not href.startswith("http") or "bing.com" in href:
                                continue

                            p_nodes = item.xpath('.//div[contains(@class, "b_caption")]//p | .//p')
                            snippet = p_nodes[0].text_content().strip() if p_nodes else ""

                            if not is_result_relevant(t_text, snippet, href, query):
                                continue

                            site_name, favicon = extract_site_metadata(href)
                            results.append({
                                "title": t_text[:110],
                                "url": href,
                                "snippet": snippet[:500],
                                "site_name": site_name,
                                "favicon": favicon,
                                "type": "web"
                            })
                            if len(results) >= max_results:
                                break
                    except Exception:
                        pass

                    # Fallback regex if lxml parsed 0 results
                    if not results:
                        raw_matches = re.findall(r'<li class="b_algo"[^>]*>.*?<h2><a[^>]+href="([^"]+)"[^>]*>(.*?)</a>.*?<p[^>]*>(.*?)</p>', resp.text, re.DOTALL)
                        for href, raw_t, raw_s in raw_matches:
                            if not href.startswith("http") or "bing.com" in href:
                                continue
                            t_text = re.sub(r'<[^>]+>', '', raw_t).strip()
                            snippet = re.sub(r'<[^>]+>', '', raw_s).strip()
                            if not is_result_relevant(t_text, snippet, href, query):
                                continue
                            site_name, favicon = extract_site_metadata(href)
                            results.append({
                                "title": t_text[:110],
                                "url": href,
                                "snippet": snippet[:500],
                                "site_name": site_name,
                                "favicon": favicon,
                                "type": "web"
                            })
                            if len(results) >= max_results:
                                break
        except Exception as e:
            logger.debug(f"Bing HTML fallback search error: {e}")
        return results

    def search_google_news(self, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        """
        Retrieves real-time verified news and web mentions from Google News RSS.
        Completely immune to datacenter IP rate limits (Render/AWS/GCP).
        """
        clean_q = re.sub(r'[\'"]', '', query).strip()
        encoded = urllib.parse.quote_plus(clean_q)
        url = f"https://news.google.com/rss/search?q={encoded}&hl=en-US&gl=US&ceid=US:en"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/rss+xml, application/xml, text/xml, */*"
        }
        results = []
        try:
            with httpx.Client(timeout=3.5, follow_redirects=True, headers=headers) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    import xml.etree.ElementTree as ET
                    try:
                        root = ET.fromstring(resp.content)
                        for item in root.findall(".//item")[:max_results + 3]:
                            t_node = item.find("title")
                            l_node = item.find("link")
                            d_node = item.find("description")
                            s_node = item.find("source")

                            raw_title = t_node.text.strip() if t_node is not None and t_node.text else ""
                            link = l_node.text.strip() if l_node is not None and l_node.text else ""
                            publisher = s_node.text.strip() if s_node is not None and s_node.text else ""

                            title = raw_title
                            if publisher and title.endswith(f" - {publisher}"):
                                title = title[:-len(f" - {publisher}")].strip()

                            snippet = ""
                            if d_node is not None and d_node.text:
                                snippet = re.sub(r'<[^>]+>', ' ', d_node.text).strip()
                                snippet = re.sub(r'\s+', ' ', snippet)

                            if not title or not link:
                                continue
                            if not is_result_relevant(title, snippet, link, query):
                                continue

                            site_name = publisher or "Google News"
                            netloc = urlparse(link).netloc.lower().replace("www.", "")
                            favicon = f"https://unavatar.io/{netloc}" if netloc else ""

                            results.append({
                                "title": title[:110],
                                "url": link,
                                "snippet": snippet[:500] if snippet else f"Verified coverage for {title}",
                                "site_name": site_name,
                                "favicon": favicon,
                                "type": "web"
                            })
                            if len(results) >= max_results:
                                break
                    except Exception:
                        pass
        except Exception as e:
            logger.debug(f"Google News RSS search error: {e}")
        return results

    def _fallback_lite_search(self, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        """
        DuckDuckGo Lite HTML search fallback (pure server-rendered table, less prone to bot challenges).
        """
        url = "https://lite.duckduckgo.com/lite/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"
        }
        data = {"q": query}
        results = []
        try:
            with httpx.Client(timeout=3.0, follow_redirects=True, headers=headers) as client:
                resp = client.post(url, data=data)
                if resp.status_code == 200:
                    from lxml import html
                    tree = html.fromstring(resp.text)
                    links = tree.xpath('//a[contains(@class, "result-link")]')
                    snippets = tree.xpath('//td[contains(@class, "result-snippet")]')

                    for idx, a_tag in enumerate(links):
                        raw_href = a_tag.get("href", "")
                        title = a_tag.text_content().strip()
                        if "uddg=" in raw_href:
                            parsed_qs = urllib.parse.parse_qs(urllib.parse.urlparse(raw_href).query)
                            real_href = parsed_qs.get("uddg", [raw_href])[0]
                        else:
                            real_href = raw_href

                        if not real_href.startswith("http") or "duckduckgo.com" in real_href:
                            continue

                        snippet = snippets[idx].text_content().strip() if idx < len(snippets) else ""
                        if not is_result_relevant(title, snippet, real_href, query):
                            continue

                        site_name, favicon = extract_site_metadata(real_href)
                        results.append({
                            "title": title[:110],
                            "url": real_href,
                            "snippet": snippet[:500],
                            "site_name": site_name,
                            "favicon": favicon,
                            "type": "web"
                        })
                        if len(results) >= max_results:
                            break
        except Exception as e:
            logger.debug(f"DuckDuckGo Lite search error: {e}")
        return results

    def search_wikipedia(self, query: str, max_results: int = 3) -> List[Dict[str, Any]]:
        """
        Direct Wikipedia OpenSearch API retrieval for authoritative encyclopedic topics.
        """
        clean_q = re.sub(r'[\'"]', '', query).strip()
        encoded = urllib.parse.quote_plus(clean_q)
        url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={encoded}&limit={max_results}&namespace=0&format=json"
        results = []
        try:
            with httpx.Client(timeout=3.5, follow_redirects=True) as client:
                resp = client.get(url, headers={"User-Agent": "DocMindResearch/1.0"})
                if resp.status_code == 200:
                    data = resp.json()
                    if len(data) >= 4:
                        titles, descriptions, urls = data[1], data[2], data[3]
                        for t, d, u in zip(titles, descriptions, urls):
                            if u and t:
                                results.append({
                                    "title": f"{t} - Wikipedia",
                                    "url": u,
                                    "snippet": d[:500] if d else f"Wikipedia article for {t}.",
                                    "site_name": "Wikipedia",
                                    "favicon": "https://unavatar.io/wikipedia.org",
                                    "type": "web"
                                })
        except Exception as e:
            logger.debug(f"Wikipedia OpenSearch API error: {e}")
        return results

    def search_github(self, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        """
        Direct GitHub public search API for repositories and developers.
        """
        clean_q = re.sub(r'[\'"]', '', query).replace("site:github.com", "").replace("github", "").replace("repo", "").strip()
        encoded = urllib.parse.quote_plus(clean_q)
        url = f"https://api.github.com/search/repositories?q={encoded}&per_page={max_results}"
        headers = {
            "User-Agent": "DocMindResearch/1.0",
            "Accept": "application/vnd.github.v3+json"
        }
        results = []
        try:
            with httpx.Client(timeout=4.0, follow_redirects=True, headers=headers) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    items = resp.json().get("items", [])
                    for repo in items:
                        name = repo.get("full_name", "")
                        desc = repo.get("description", "") or "GitHub Repository"
                        stars = repo.get("stargazers_count", 0)
                        lang = repo.get("language") or ""
                        html_url = repo.get("html_url", "")
                        meta_info = f" ({stars} stars, {lang})" if lang else f" ({stars} stars)"
                        results.append({
                            "title": f"{name} - GitHub",
                            "url": html_url,
                            "snippet": f"GitHub Repository: {name}{meta_info}. {desc}".strip(),
                            "site_name": "GitHub",
                            "favicon": "https://unavatar.io/github.com",
                            "type": "web"
                        })
        except Exception as e:
            logger.debug(f"GitHub Search API error: {e}")
        return results

    def search_reddit(self, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        """
        Direct Reddit search API for community discussions, opinions, and reviews.
        """
        clean_q = re.sub(r'[\'"]', '', query).replace("site:reddit.com", "").replace("reddit", "").strip()
        encoded = urllib.parse.quote_plus(clean_q)
        url = f"https://www.reddit.com/search.json?q={encoded}&limit={max_results}&sort=relevance"
        headers = {"User-Agent": "DocMindResearch/1.0"}
        results = []
        try:
            with httpx.Client(timeout=4.0, follow_redirects=True, headers=headers) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    posts = resp.json().get("data", {}).get("children", [])
                    for p in posts:
                        p_data = p.get("data", {})
                        title = p_data.get("title", "")
                        permalink = p_data.get("permalink", "")
                        subreddit = p_data.get("subreddit_name_prefixed", "r/reddit")
                        selftext = p_data.get("selftext", "")[:350]
                        if title and permalink:
                            results.append({
                                "title": f"{title} : {subreddit}",
                                "url": f"https://www.reddit.com{permalink}",
                                "snippet": f"{subreddit} discussion: {title}. {selftext}".strip(),
                                "site_name": subreddit,
                                "favicon": "https://unavatar.io/reddit.com",
                                "type": "web"
                            })
        except Exception as e:
            logger.debug(f"Reddit Search API error: {e}")
        return results

    def search_youtube(self, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        """
        Directly queries YouTube search and parses channel / video cards.
        Bypasses search engine rate-limits and blocks on cloud datacenter IPs.
        """
        clean_q = re.sub(r'[\'"]', '', query).strip()
        encoded = urllib.parse.quote_plus(clean_q)
        url = f"https://www.youtube.com/results?search_query={encoded}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
        }
        results = []
        try:
            with httpx.Client(timeout=4.0, follow_redirects=True) as client:
                resp = client.get(url, headers=headers)
                if resp.status_code == 200:
                    html_text = resp.text
                    match = re.search(r'var ytInitialData\s*=\s*({.+?});</script>', html_text)
                    if match:
                        data = json.loads(match.group(1))
                        contents = (
                            data.get("contents", {})
                            .get("twoColumnSearchResultsRenderer", {})
                            .get("primaryContents", {})
                            .get("sectionListRenderer", {})
                            .get("contents", [])
                        )
                        for sec in contents:
                            item_sec = sec.get("itemSectionRenderer", {}).get("contents", [])
                            for item in item_sec:
                                # Channel result
                                if "channelRenderer" in item:
                                    ch = item["channelRenderer"]
                                    ch_id = ch.get("channelId", "")
                                    title = ch.get("title", {}).get("simpleText") or "YouTube Channel"
                                    subs = ch.get("subscriberCountText", {}).get("simpleText", "")
                                    desc = "".join(r.get("text", "") for r in ch.get("descriptionSnippet", {}).get("runs", []))
                                    ch_url = f"https://www.youtube.com/channel/{ch_id}"
                                    if "navigationEndpoint" in ch:
                                        canon = ch["navigationEndpoint"].get("browseEndpoint", {}).get("canonicalBaseUrl", "")
                                        if canon:
                                            ch_url = f"https://www.youtube.com{canon}"
                                    results.append({
                                        "title": f"{title} - YouTube",
                                        "url": ch_url,
                                        "snippet": f"Official YouTube Channel: {title}. {subs}. {desc}".strip(),
                                        "site_name": "YouTube",
                                        "favicon": "https://unavatar.io/youtube.com",
                                        "type": "web"
                                    })
                                # Video result
                                elif "videoRenderer" in item:
                                    vid = item["videoRenderer"]
                                    vid_id = vid.get("videoId", "")
                                    v_title = "".join(r.get("text", "") for r in vid.get("title", {}).get("runs", []))
                                    ch_name = "".join(r.get("text", "") for r in vid.get("ownerText", {}).get("runs", []))
                                    desc_snippet = ""
                                    if vid.get("detailedMetadataSnippets"):
                                        desc_snippet = "".join(r.get("text", "") for r in vid["detailedMetadataSnippets"][0].get("snippetText", {}).get("runs", []))
                                    vid_url = f"https://www.youtube.com/watch?v={vid_id}"
                                    results.append({
                                        "title": f"{v_title} - YouTube",
                                        "url": vid_url,
                                        "snippet": f"YouTube video by {ch_name}: {v_title}. {desc_snippet}".strip(),
                                        "site_name": "YouTube",
                                        "favicon": "https://unavatar.io/youtube.com",
                                        "type": "web"
                                    })
                                if len(results) >= max_results:
                                    break
        except Exception as e:
            logger.warning(f"Direct YouTube search error: {e}")

        return results

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
                                "favicon": favicon or "https://unavatar.io/wikipedia.org",
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

                # Specialized parsing for Kick
                if "kick.com" in clean_u.lower():
                    desc_match = re.search(r'<meta\s+(?:name|property)=["\'](?:description|og:description)["\']\s+content=["\'](.*?)["\']', html_text, re.IGNORECASE)
                    desc_text = desc_match.group(1).strip() if desc_match else ""
                    return {
                        "url": clean_u,
                        "title": title[:100],
                        "snippet": desc_text[:1500] if desc_text else "Kick Live Stream Channel",
                        "site_name": "Kick",
                        "favicon": favicon or "https://unavatar.io/kick.com",
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


