from crewai import Agent, LLM
from backend.ai.prompts.answer_prompt import (
    get_answer_agent_role, get_answer_agent_goal, get_answer_agent_backstory
)

def create_answer_agent(llm: LLM, display_name: str) -> Agent:
    return Agent(
        role=get_answer_agent_role(display_name),
        goal=get_answer_agent_goal(),
        backstory=get_answer_agent_backstory(display_name),
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
