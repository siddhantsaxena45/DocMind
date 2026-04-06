import json
from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings, api_key_rotator

class FlashcardGenerator:
    def __init__(self):
        pass

    def generate_flashcards(self, text: str) -> list:
        for key in api_key_rotator.get_rotated_google_keys():
            try:
                from crewai import LLM
                llm = LLM(model="gemini/gemini-2.5-flash", api_key=key, temperature=0.3)
                
                educator = Agent(
                    role="Expert Educator",
                    goal="Create effective learning materials from documentation.",
                    backstory="You are a highly skilled educator who knows how to break down complex information into easily digestible flashcards that promote active recall.",
                    verbose=False,
                    allow_delegation=False,
                    llm=llm
                )
                
                flashcard_task = Task(
                    description=f"""
Create 5 high-quality educational flashcards based on the most important concepts in the text.
Return ONLY a JSON list of objects with 'question' and 'answer' keys.
Do not format as markdown. Just output raw JSON list.

Text: {text[:20000]}
""",
                    expected_output="A JSON list of 5 objects, each with 'question' and 'answer' string fields.",
                    agent=educator
                )
                
                crew = Crew(
                    agents=[educator],
                    tasks=[flashcard_task],
                    verbose=False,
                    process=Process.sequential
                )
                
                result = crew.kickoff()
                res = str(getattr(result, 'raw', str(result)))
                
                # Clean up
                if res.strip().startswith("```json"): 
                    res = res.strip()[7:-3]
                elif res.strip().startswith("```"): 
                    res = res.strip()[3:-3]
                    
                return json.loads(res.strip())
            except Exception as e:
                print(f"Error in flashcard generator: {e}")
                continue
                
        return []

flashcard_generator = FlashcardGenerator()
