from crewai import Agent, LLM
from backend.ai.prompts.qa_prompt import (
    QA_AGENT_ROLE, get_qa_agent_goal, QA_AGENT_BACKSTORY
)

def create_qa_agent(llm: LLM) -> Agent:
    return Agent(
        role=QA_AGENT_ROLE,
        goal=get_qa_agent_goal(),
        backstory=QA_AGENT_BACKSTORY,
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
