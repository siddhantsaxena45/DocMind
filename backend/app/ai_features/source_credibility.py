import json
from crewai import Agent, Task, Crew, Process
from app.core.config import settings, api_key_rotator

class CredibilityEvaluator:
    def __init__(self):
        pass

    def evaluate_sources(self, sources_list: list) -> dict:
        """
        Takes a list of search sources (dict with 'href', 'title', 'body') 
        and evaluates their credibility using AI.
        """
        if not sources_list:
            return {"credibility_score": 0, "evaluations": [], "summary": "No sources provided."}

        for key in api_key_rotator.get_rotated_google_keys():
            try:
                from crewai import LLM
                llm = LLM(model="gemini/gemini-2.5-flash", api_key=key, temperature=0.1)
                
                analyst = Agent(
                    role="Source Reputation Analyst",
                    goal="Evaluate the bias, authority, and reliability of information sources.",
                    backstory="You are an expert in media literacy and source verification. You can identify academic journals, government sites, news bias, and 'content mills'.",
                    verbose=False,
                    llm=llm
                )
                
                analysis_task = Task(
                    description=f"""
Analyze the following list of web sources for credibility. 
For each source, provide:
1. **Category**: (e.g., Academic, News, Personal Blog, Government, Corporate, Content Mill).
2. **Reliability Score**: (0-100).
3. **Bias Check**: (e.g., Neutral, Left-leaning, Right-leaning, Commercial interest).
4. **Authority**: Why should we (or shouldn't we) trust this site?

Sources to analyze:
{json.dumps(sources_list, indent=2)}

Return ONLY a valid JSON object bounded by ---JSON_START--- and ---JSON_END---:
---JSON_START---
{{
    "overall_credibility_score": 85,
    "evaluations": [
        {{
            "url": "https://example.com",
            "score": 90,
            "category": "Academic",
            "bias": "Neutral",
            "notes": "Highly authoritative peer-reviewed journal."
        }}
    ],
    "summary": "A brief summary of the overall reliability of the research pool."
}}
---JSON_END---
""",
                    expected_output="A JSON object with credibility metrics for each source.",
                    agent=analyst
                )
                
                crew = Crew(
                    agents=[analyst],
                    tasks=[analysis_task],
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
                print(f"Error evaluating credibility: {e}")
                continue
                
        return {"error": "Failed to complete evaluation."}

credibility_evaluator = CredibilityEvaluator()
