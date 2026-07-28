from crewai import Task, Agent
from backend.ai.prompts.planner_prompt import get_planner_task_description

def create_planner_task(
    agent: Agent,
    display_name: str,
    experience: int,
    difficulty: str,
    mandatory: str,
    optional: str,
    excluded: str,
    total_questions: int
) -> Task:
    return Task(
        description=get_planner_task_description(display_name, experience, difficulty, mandatory, optional, excluded, total_questions),
        expected_output="Structured interview blueprint.",
        agent=agent
    )
