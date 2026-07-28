from crewai import Agent, LLM
from backend.ai.prompts.evaluation_prompt import (
    EVALUATOR_ROLE, EVALUATOR_GOAL, EVALUATOR_BACKSTORY
)

def create_evaluator_agent(llm: LLM) -> Agent:
    return Agent(
        role=EVALUATOR_ROLE,
        goal=EVALUATOR_GOAL,
        backstory=EVALUATOR_BACKSTORY,
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
