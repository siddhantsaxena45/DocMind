import trafilatura
from crewai import Agent, Task, Crew, Process
from crewai.tools import tool
from ddgs import DDGS
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings, api_key_rotator

# Global list to temporarily store search results for the current request
# In a production multi-user environment, this should be handled per-request
_current_sources = []

@tool("DuckDuckGo Web Search")
def web_search(query: str) -> str:
    """Searches the web for a given topic and returns snippets of information and URLs."""
    try:
        ddgs = DDGS()
        results = list(ddgs.text(query, max_results=5))
        if not results:
            return "No results found."
        
        # Capture sources for the return payload
        for r in results:
            if not any(s['href'] == r['href'] for s in _current_sources):
                _current_sources.append({
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
        # Improved headers to avoid being blocked
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        
        # Using httpx to fetch with headers correctly
        with httpx.Client(headers=headers, timeout=10.0, follow_redirects=True) as client:
            response = client.get(url)
            if response.status_code != 200:
                return f"Failed to download content from {url} (Status: {response.status_code})"
                
            html_content = response.text
            
        content = trafilatura.extract(html_content)
        if not content:
            return f"Could not extract meaningful text from {url}"
        return content[:8000] 
    except Exception as e:
        return f"Error reading page {url}: {e}"

class ResearchAgent:
    def __init__(self):
        pass

    def research(self, topic: str) -> dict:
        global _current_sources
        _current_sources = [] # Reset for this request
        
        for key in api_key_rotator.get_rotated_google_keys():
            try:
                from crewai import LLM
                llm = LLM(model="gemini/gemini-2.5-flash", api_key=key, temperature=0.2)
                
                researcher = Agent(
                    role="Senior Research Analyst",
                    goal="Conduct comprehensive web research by searching AND reading full webpage content to synthesize findings into a clear report.",
                    backstory="You are an expert researcher who uses web search to gather accurate information. You don't just rely on snippets; you read the full content of relevant pages to ensure depth and accuracy.",
                    verbose=False,
                    allow_delegation=False,
                    tools=[web_search, read_web_page],
                    llm=llm,
                    max_iter=8,
                    max_rpm=15,
                    max_execution_time=180
                )
                
                research_task = Task(
                    description=f"""
Topic to research: "{topic}"

1. Use the DuckDuckGo Web Search tool to find relevant URLs.
2. Use the Read Webpage Content tool on the most promising 2-3 URLs to gather deep insights.
3. Synthesize the findings into a comprehensive Markdown report. 
4. Include a "Key Findings" section and a "Deep Dive" section based on the read content.
5. Use inline citations [1], [2] throughout the text.
6. MANDATORY: Include a "References" section at the end of the report where you list the URLs corresponding to each citation number.

Format your absolute final output EXACTLY as follows:
---REPORT_START---
# [Topic Title]
[The full markdown report with citations]

## References
- [1] [Source Title](URL)
- [2] [Source Title](URL)
---REPORT_END---
""",
                    expected_output="A single complete report bounded by ---REPORT_START--- and ---REPORT_END---.",
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
                
                if "---REPORT_START---" in res and "---REPORT_END---" in res:
                    report = res.split("---REPORT_START---")[1].split("---REPORT_END---")[0].strip()
                else:
                    report = res
                    
                return {
                    "report": report,
                    "sources": _current_sources
                }
            except Exception as e:
                print(f"Error in research agent: {e}")
                pass
                
        raise Exception("Failed to complete research. API might be exhausted or error occurred.")

research_agent = ResearchAgent()
