from crewai import Agent, LLM
from backend.ai.prompts.question_prompt import (
    get_question_agent_role, get_question_agent_goal, get_question_agent_backstory
)

def create_question_agent(llm: LLM, display_name: str, total_questions: int) -> Agent:
    return Agent(
        role=get_question_agent_role(display_name),
        goal=get_question_agent_goal(total_questions),
        backstory=get_question_agent_backstory(display_name),
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
