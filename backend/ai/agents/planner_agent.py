from crewai import Agent, LLM
from backend.ai.prompts.planner_prompt import (
    PLANNER_ROLE, PLANNER_BACKSTORY, get_planner_goal
)

def create_planner_agent(
    llm: LLM,
    display_name: str,
    mandatory: str,
    optional: str,
    excluded: str,
    total_questions: int,
    experience: int,
    difficulty: str
) -> Agent:
    return Agent(
        role=PLANNER_ROLE,
        goal=get_planner_goal(display_name, mandatory, optional, excluded, total_questions, experience, difficulty),
        backstory=PLANNER_BACKSTORY,
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
