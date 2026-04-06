import json
from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings, api_key_rotator

class KnowledgeGraphBuilder:
    def __init__(self):
        pass

    def build_graph(self, text: str) -> list:
        for key in api_key_rotator.get_rotated_google_keys():
            try:
                from crewai import LLM
                llm = LLM(model="gemini/gemini-2.5-flash", api_key=key, temperature=0.1)
                
                engineer = Agent(
                    role="Knowledge Engineer",
                    goal="Map out clear and concise relationships between entities in text.",
                    backstory="You are an expert at extracting ontological relationships and representing knowledge as a graph.",
                    verbose=False,
                    allow_delegation=False,
                    llm=llm
                )
                
                graph_task = Task(
                    description=f"""
Extract a sophisticated knowledge graph from the following text.
Identify key entities (nodes) and the relationships between them (edges).
For each edge, you MUST provide:
- 'source': The name of the starting entity.
- 'target': The name of the related entity.
- 'relation': A concise description of the relationship.
- 'confidence': An integer (0-100) representing how clearly this relationship is stated in the text.
- 'evidence': A short (max 10 words) snippet from the text justifying this link.

Keep the graph high-quality, max 20 edges. Return ONLY raw JSON text.

Text: {text[:20000]}
""",
                    expected_output="A JSON list of objects with 'source', 'target', 'relation', 'confidence', and 'evidence' keys.",
                    agent=engineer
                )
                
                crew = Crew(
                    agents=[engineer],
                    tasks=[graph_task],
                    verbose=False,
                    process=Process.sequential
                )
                
                result = crew.kickoff()
                res = str(getattr(result, 'raw', str(result)))
                
                if res.strip().startswith("```json"): 
                    res = res.strip()[7:-3]
                elif res.strip().startswith("```"): 
                    res = res.strip()[3:-3]
                    
                return json.loads(res.strip())
            except Exception as e:
                print(f"Error building graph: {e}")
                continue
                
        return []

knowledge_graph_builder = KnowledgeGraphBuilder()
