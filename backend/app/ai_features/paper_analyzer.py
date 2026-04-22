import json
import re
from crewai import Agent, Task, Crew, Process, LLM
from app.core.config import api_key_rotator

class PaperAnalyzer:
    def analyze_paper(self, text: str) -> dict:
        for key in api_key_rotator.get_rotated_google_keys():
            try:
                llm = LLM(model="gemini/gemini-2.5-flash", api_key=key, temperature=0.1)
                
                methodology_extractor = Agent(
                    role="Academic Data Extractor",
                    goal="Extract core research components from the paper text.",
                    backstory="You are an expert at parsing academic papers and extracting technical methodologies and datasets.",
                    verbose=False,
                    llm=llm
                )

                critical_reviewer = Agent(
                    role="Peer Reviewer",
                    goal="Identify limitations and future research directions.",
                    backstory="You are a critical reviewer specializing in identifying gaps and constraints in academic research.",
                    verbose=False,
                    llm=llm
                )

                # Use more text if available, up to 15000 chars
                extract_task = Task(
                    description=f"Analyze the following paper text and extract research objective, methodology, and datasets.\n\nText:\n{text[:15000]}",
                    expected_output="A summary of research components.",
                    agent=methodology_extractor
                )

                review_task = Task(
                    description="Based on the analysis, identify limitations and future scope. Format as JSON.",
                    expected_output="""A JSON object:
---JSON_START---
{
    "research_objective": "...",
    "methodology": ["..."],
    "datasets_used": ["..."],
    "limitations": ["..."],
    "future_scope": "..."
}
---JSON_END---""",
                    agent=critical_reviewer,
                    context=[extract_task]
                )

                crew = Crew(
                    agents=[methodology_extractor, critical_reviewer],
                    tasks=[extract_task, review_task],
                    verbose=False,
                    process=Process.sequential
                )

                result = crew.kickoff()
                res = str(getattr(result, 'raw', str(result)))
                
                # Robust JSON extraction
                json_str = ""
                if "---JSON_START---" in res:
                    json_str = res.split("---JSON_START---")[1].split("---JSON_END---")[0].strip()
                else:
                    # Fallback to regex for any JSON-like block
                    match = re.search(r'\{.*\}', res, re.DOTALL)
                    if match:
                        json_str = match.group(0)
                
                if json_str:
                    try:
                        return json.loads(json_str)
                    except json.JSONDecodeError:
                        # Clean common LLM formatting issues
                        clean_json = re.sub(r'//.*', '', json_str) # Remove comments
                        return json.loads(clean_json)
                        
                return {"error": "Could not parse analysis results."}
            except Exception as e:
                print(f"Error in paper analyzer attempt: {e}")
                continue
        
        return {"error": "Failed to analyze paper after multiple attempts."}

paper_analyzer_feature = PaperAnalyzer()
