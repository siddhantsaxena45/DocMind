import json
from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings, api_key_rotator

class SummarizerFeature:
    def __init__(self):
        pass

    def generate_document_intelligence(self, text: str) -> dict:
        for current_key in api_key_rotator.get_rotated_google_keys():
            try:
                from crewai import LLM
                llm = LLM(model="gemini/gemini-2.5-flash", api_key=current_key, temperature=0.2)
                
                analyst = Agent(
                    role="Document Intelligence Analyst",
                    goal="Analyze documents deeply and extract structured intelligence.",
                    backstory="You are an expert analyst who can quickly comprehend complex documents and extract key summaries, topics, keywords, and entities.",
                    verbose=False,
                    allow_delegation=False,
                    llm=llm
                )
                
                analysis_task = Task(
                    description=f"""
Analyze the following document text and provide a comprehensive intelligence report.
Return ONLY a valid JSON object with the following exact structure (no markdown, no backticks, just the unformatted JSON string):
{{
    "summary": "A 2-3 paragraph summary of the document.",
    "topics": ["Topic 1", "Topic 2", "Topic 3"],
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "entities": ["Person A", "Organization B", "Date C"]
}}

Document Text:
{text[:30000]}
""",
                    expected_output="A valid JSON object containing the summary, topics, keywords, and entities.",
                    agent=analyst
                )
                
                crew = Crew(
                    agents=[analyst],
                    tasks=[analysis_task],
                    verbose=False,
                    process=Process.sequential
                )
                
                result = crew.kickoff()
                content = str(getattr(result, 'raw', str(result)))
                
                if content.strip().startswith("```json"):
                    content = content.strip()[7:-3]
                elif content.strip().startswith("```"):
                    content = content.strip()[3:-3]
                    
                data = json.loads(content.strip())
                return data
            except Exception as e:
                if "exhausted" in str(e).lower() or "429" in str(e):
                    continue
                print(f"Error in summarizer parsing: {e}")
                
        return {
            "summary": "Could not generate summary due to API limits or errors.",
            "topics": [],
            "keywords": [],
            "entities": []
        }

summarizer_feature = SummarizerFeature()
