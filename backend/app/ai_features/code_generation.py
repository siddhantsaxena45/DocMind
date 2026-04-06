from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings, api_key_rotator

class CodeGenerator:
    def __init__(self):
        pass

    def generate_code(self, prompt_text: str, context: str = "") -> str:
        for key in api_key_rotator.get_rotated_google_keys():
            try:
                from crewai import LLM
                llm = LLM(model="gemini/gemini-2.5-flash", api_key=key, temperature=0.2)
                
                swe = Agent(
                    role="Senior Software Engineer",
                    goal="Write clean, efficient, and production-ready code.",
                    backstory="You are an expert software developer with a focus on writing clean, idiomatic code. You strictly provide code solutions without redundant comments. You never comment on trivial things like string lengths or basic syntax. You provide explanations only for complex logic when necessary, and only within the code blocks.",
                    verbose=False,
                    allow_delegation=False,
                    llm=llm
                )
                
                coding_task = Task(
                    description=f"""
Generate high-quality, idiomatic code based on the following request. 

Request: {prompt_text}

Context (if any):
{context}

Guidelines:
1. Provide ONLY markdown code blocks.
2. Ensure the code is production-ready and follows best practices.
3. Avoid redundant or trivial comments (e.g., don't explain every string or its length).
4. No conversational filler or introductory text.
""",
                    expected_output="A high-quality markdown code block.",
                    agent=swe
                )
                
                crew = Crew(
                    agents=[swe],
                    tasks=[coding_task],
                    verbose=False,
                    process=Process.sequential
                )
                
                result = crew.kickoff()
                return str(getattr(result, 'raw', str(result)))
                
            except Exception as e:
                if "exhausted" in str(e).lower() or "429" in str(e):
                    continue
                raise Exception(f"Code gen error: {e}")
                
        raise Exception("API Keys exhausted.")

code_generator = CodeGenerator()
