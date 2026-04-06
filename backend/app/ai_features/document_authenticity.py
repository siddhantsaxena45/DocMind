import json
import trafilatura
from crewai import Agent, Task, Crew, Process
from crewai.tools import tool
from ddgs import DDGS
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings, api_key_rotator

@tool("DuckDuckGo Web Search")
def web_search(query: str) -> str:
    """Searches the web for the given query and returns snippets of results and URLs."""
    try:
        ddgs = DDGS()
        results = list(ddgs.text(query, max_results=5))
        if not results:
            return "No results found."
        context = "\n".join([f"Title: {r['title']}\nSnippet: {r['body']}\nURL: {r['href']}\n" for r in results])
        return context
    except Exception as e:
        return f"Error during search: {e}"

@tool("Read Webpage Content")
def read_web_page(url: str) -> str:
    """Fetches and extracts the main text content from a given URL for deep verification. Use this on personal profiles (LinkedIn, LeetCode, GitHub) if found in the document."""
    try:
        import httpx
        import random
        
        # Comprehensive browser-like headers to reduce blocking
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
        ]
        
        headers = {
            'User-Agent': random.choice(user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.google.com/',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
        }
        
        # Using httpx with a realistic timeout and follow redirects
        with httpx.Client(headers=headers, timeout=12.0, follow_redirects=True) as client:
            response = client.get(url)
            
            if response.status_code == 403:
                return f"Verification Hint: The site {url} is currently blocking deep-reading (403 Forbidden). Please use 'DuckDuckGo Web Search' to find snippets or cached versions of this specific profile to verify the claims."
            
            if response.status_code != 200:
                return f"Failed to download content from {url} (Status: {response.status_code})"
            
            html_content = response.text
            
        content = trafilatura.extract(html_content)
        if not content:
            return f"Could not extract meaningful text from {url}. The page might be JavaScript-heavy or protected."
        return content[:8000] 
    except Exception as e:
        return f"Error reading page {url}: {e}"

class AuthenticityChecker:
    def __init__(self):
        pass

    def verify_document(self, text: str) -> dict:
        for key in api_key_rotator.get_rotated_google_keys():
            try:
                from crewai import LLM
                llm = LLM(model="gemini/gemini-2.5-flash", api_key=key, temperature=0.1)
                
                fact_checker = Agent(
                    role="Investigative Fact Checker",
                    goal="Verify claims by prioritizing URLs found within the document itself, then cross-referencing with the live web.",
                    backstory="""You are a skeptical yet fair investigative auditor. 
Your primary directive is to verify claims using the most RECENT and RELEVANT sources.
CRITICAL: If the document provides a link (LinkedIn, Portfolio, LeetCode, GitHub), you MUST visit and read that link FIRST. 
Personal profiles provided by the user are the PRIMARY source of truth for their specific achievements.
Be aware of 'Conflict vs Evolution'—a '9.09 CGPA' in a 2026/2027 document IS NOT contradicted by an 8.2 CGPA found in an older 2024 web source.""",
                    verbose=False,
                    allow_delegation=False,
                    tools=[web_search, read_web_page],
                    llm=llm,
                    max_iter=12,        
                    max_rpm=15,        
                    max_retry_limit=2,
                    max_execution_time=250
                )
                
                verify_task = Task(
                    description=f"""
Step 1: EXTRACT LINKS. Scan the provided text, especially the '[DOC_LINKS]' section at the end, for any URLs (LinkedIn, GitHub, LeetCode, Portfolio, YouTube, etc.).
Step 2: IDENTIFY CLAIMS. Extract 3-5 of the most significant factual claims (Education, GPA, Projects, Internships).
Step 3: LINK-FIRST VERIFICATION. For EACH claim:
    a) Check Step 1 for a matching link (e.g., if the claim is about LeetCode, find the LeetCode URL in '[DOC_LINKS]').
    b) Use 'Read Webpage Content' on that specific URL FIRST. If the link confirms the claim, mark as "Verified".
    c) ONLY if no direct link exists or if it fails to confirm the claim, use 'DuckDuckGo Web Search'.
Step 4: CONFLICT RESOLUTION. 
    - Favor the document's claims if they are more recent (e.g., a 2026 graduation target implies a current GPA, which may differ from a 2024 archive).
    - Match specific usernames/IDs from the [DOC_LINKS] (e.g., 'Siddhant-0207') to ensure you aren't verifying the wrong person.

Return ONLY a valid JSON object with the following strictly enforced structure bounded by ---JSON_START--- and ---JSON_END---:
---JSON_START---
{{
    "score": [An integer 0-100. Be fair but thorough. 100 if all core claims are verified by document links.],
    "verified_sources": [
        {{"claim": "The exact claim", "sources": ["https://link-from-document.com"], "status": "Verified", "evidence_snippet": "Direct proof found on the user's profile."}}
    ],
    "unverified_claims": [
        {{"claim": "The suspicious claim", "reason": "Reason why even the user's own links or web search couldn't confirm this.", "status": "Unverified"}}
    ]
}}
---JSON_END---

Text to verify:
{text[:10000]}
""",
                    expected_output="A strictly formatted JSON text bounded by ---JSON_START--- and ---JSON_END--- containing 'score', 'verified_sources', and 'unverified_claims'.",
                    agent=fact_checker
                )
                
                crew = Crew(
                    agents=[fact_checker],
                    tasks=[verify_task],
                    verbose=False,
                    process=Process.sequential
                )
                
                result = crew.kickoff()
                res = str(getattr(result, 'raw', str(result)))
                
                if "---JSON_START---" in res and "---JSON_END---" in res:
                    res = res.split("---JSON_START---")[1].split("---JSON_END---")[0].strip()
                elif res.strip().startswith("```json"): 
                    res = res.strip()[7:-3]
                elif res.strip().startswith("```"): 
                    res = res.strip()[3:-3]
                    
                return json.loads(res.strip())
                
            except Exception as e:
                print(f"Error in authenticity checker crew: {e}")
                pass
                
        # If all keys failed via CrewAI, do a direct, simple Langchain LLM fallback
        try:
            print("CrewAI exhausted all keys. Attempting single direct fallback...")
            from langchain_google_genai import ChatGoogleGenerativeAI
            
            keys = api_key_rotator.get_rotated_google_keys()
            if keys:
                fallback_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=keys[0], temperature=0.1)
                fallback_prompt = f"""
Analyze the following text objectively and extract up to 3 factual claims. Categorize them and assign a reliability score.
Return ONLY a valid JSON object with the following structure bounded by ---JSON_START--- and ---JSON_END---:
---JSON_START---
{{
    "score": 70,
    "verified_sources": [
        {{"claim": "The exact claim", "sources": ["General Knowledge"], "status": "Likely Verified"}}
    ],
    "unverified_claims": []
}}
---JSON_END---

Text: {text[:5000]}
"""
                res = fallback_llm.invoke(fallback_prompt).content
                if "---JSON_START---" in res and "---JSON_END---" in res:
                    res = res.split("---JSON_START---")[1].split("---JSON_END---")[0].strip()
                elif res.strip().startswith("```json"): 
                    res = res.strip()[7:-3]
                elif res.strip().startswith("```"): 
                    res = res.strip()[3:-3]
                    
                return json.loads(res.strip())
        except Exception as e:
            print("Direct fallback also failed:", e)

        return {"score": 0, "verified_sources": [], "unverified_claims": [{"claim": "All API Keys exhausted", "reason": "Could not complete verification due to quota limits."}], "error": True}

authenticity_checker = AuthenticityChecker()
