import json
from crewai import Agent, Task, Crew, Process
from crewai.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import api_key_rotator

class ResumeOptimizer:
    def optimize_resume(self, text: str, job_description: str = "") -> dict:
        for key in api_key_rotator.get_rotated_google_keys():
            try:
                from crewai import LLM
                llm = LLM(model="gemini/gemini-2.5-flash", api_key=key, temperature=0.2)
                
                ats_scanner = Agent(
                    role="ATS Scoring System",
                    goal="Parse the resume strictly for formatting, missing sections, and core engineering keywords. Provide an initial ATS score out of 100.",
                    backstory="An unforgiving, automated HR Application Tracking System parsing B.Tech resumes.",
                    verbose=False,
                    llm=llm
                )

                tech_recruiter = Agent(
                    role="Senior Engineering Recruiter",
                    goal="Critique the bullet points using the STAR method. Suggest specific, impactful rewrites for the experience and project sections.",
                    backstory="A ruthless technical recruiter at a FAANG company who demands quantifiable metrics and impact.",
                    verbose=False,
                    llm=llm
                )

                scan_task = Task(
                    description=f"Analyze the resume for core formatting, missing sections, missing tech stack keywords relative to the given Job Description and provide an ATS score."
                                + (f"\n\nTarget Job Description:\n{job_description[:3000]}" if job_description else "")
                                + f"\n\nResume content:\n{text[:8000]}",
                    expected_output="A list of missing skills/sections and an ATS score out of 100.",
                    agent=ats_scanner
                )

                critique_task = Task(
                    description="Take the resume text and the ATS scanner's findings. Identify 3 weak bullet points and provide 'STAR' method rewrites for them tailored to the Job Description. Return ONLY valid JSON.",
                    expected_output="""A strictly formatted JSON object bounded by ---JSON_START--- and ---JSON_END---:
---JSON_START---
{
    "ats_score": 75,
    "missing_sections_or_keywords": ["Testing (Jest/PyTest)", "System Design"],
    "bullet_rewrites": [
        {"original": "Made a CRUD app in React", "suggestion": "Developed a full-stack React application with Redux state management, reducing data fetch times by 20% and improving user retention."}
    ],
    "overall_feedback": "Short paragraph of tactical advice."
}
---JSON_END---""",
                    agent=tech_recruiter,
                    context=[scan_task]
                )

                crew = Crew(
                    agents=[ats_scanner, tech_recruiter],
                    tasks=[scan_task, critique_task],
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
                print(f"Error in resume optimizer crew: {e}")
                pass
        
        return {"ats_score": 0, "error": "Failed to process resume or exhausted quotas."}

resume_agent_feature = ResumeOptimizer()
