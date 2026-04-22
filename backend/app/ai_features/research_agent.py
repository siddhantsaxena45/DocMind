import trafilatura
from crewai import Agent, Task, Crew, Process, LLM
from crewai.tools import tool
from ddgs import DDGS
import threading
from app.core.config import settings, api_key_rotator

# Use thread-local storage for sources to ensure concurrency safety
_thread_local = threading.local()

@tool("DuckDuckGo Web Search")
def web_search(query: str) -> str:
    """Searches the web for a given topic and returns snippets of information and URLs."""
    try:
        ddgs = DDGS()
        results = list(ddgs.text(query, max_results=5))
        if not results:
            return "No results found."
        
        # Capture sources for the return payload in a thread-safe way
        if not hasattr(_thread_local, 'sources'):
            _thread_local.sources = []
            
        for r in results:
            if not any(s['href'] == r['href'] for s in _thread_local.sources):
                _thread_local.sources.append({
                    "title": r.get('title', 'Unknown Title'),
                    "href": r.get('href', ''),
                    "body": r.get('body', '')
                })
        
        context = "\n".join([f"Title: {r['title']}\nSnippet: {r['body']}\nURL: {r['href']}\n" for r in results])
        return context
    except Exception as e:
        return f"Error during search: {e}"

@tool("Read Webpage Content")
def read_web_page(url: str) -> str:
    """Fetches and extracts the main text content from a given URL for deep research."""
    try:
        import httpx
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        }
        
        with httpx.Client(headers=headers, timeout=15.0, follow_redirects=True) as client:
            response = client.get(url)
            if response.status_code != 200:
                return f"Failed to download content from {url} (Status: {response.status_code})"
            html_content = response.text
            
        content = trafilatura.extract(html_content)
        if not content:
            return f"Could not extract meaningful text from {url}"
        return content[:10000] 
    except Exception as e:
        return f"Error reading page {url}: {e}"

class ResearchAgent:
    def research(self, topic: str) -> dict:
        # Initialize thread-local sources for this specific request
        _thread_local.sources = []
        
        for key in api_key_rotator.get_rotated_google_keys():
            try:
                llm = LLM(model="gemini/gemini-2.5-flash", api_key=key, temperature=0.2)
                
                researcher = Agent(
                    role="Senior Research Analyst",
                    goal="Conduct comprehensive web research by searching AND reading full webpage content to synthesize findings.",
                    backstory="You are an expert researcher who uses web search to gather accurate information. You read full page content for depth.",
                    verbose=False,
                    allow_delegation=False,
                    tools=[web_search, read_web_page],
                    llm=llm,
                    max_iter=10,
                    max_rpm=20
                )
                
                research_task = Task(
                    description=f"""
Topic to research: "{topic}"

1. Use DuckDuckGo to find relevant URLs.
2. Read the most promising 2-3 URLs for deep insights.
3. Synthesize findings into a professional Markdown report.
4. Use inline citations like [1], [2].
5. Include a "References" section at the end.

Format your absolute final output EXACTLY as follows:
---REPORT_START---
# [Topic Title]
[Report Content]

## References
- [1] [Title](URL)
---REPORT_END---
""",
                    expected_output="A complete report bounded by ---REPORT_START--- and ---REPORT_END---.",
                    agent=researcher
                )
                
                crew = Crew(
                    agents=[researcher],
                    tasks=[research_task],
                    verbose=False,
                    process=Process.sequential
                )
                
                result = crew.kickoff()
                res = str(getattr(result, 'raw', str(result)))
                
                if "---REPORT_START---" in res:
                    parts = res.split("---REPORT_START---")
                    report = parts[1].split("---REPORT_END---")[0].strip() if "---REPORT_END---" in parts[1] else parts[1].strip()
                else:
                    report = res.strip()
                    
                return {
                    "report": report,
                    "sources": list(_thread_local.sources)
                }
            except Exception as e:
                print(f"Error in research agent attempt: {e}")
                continue
                
        raise Exception("Failed to complete research after multiple attempts.")

research_agent = ResearchAgent()
