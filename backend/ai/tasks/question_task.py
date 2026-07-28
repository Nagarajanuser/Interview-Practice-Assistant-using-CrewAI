from crewai import Task, Agent
from backend.ai.prompts.question_prompt import get_question_task_description

def create_question_task(
    agent: Agent,
    plan_task: Task,
    display_name: str,
    total_questions: int,
    experience: int,
    difficulty: str,
    mandatory: str,
    excluded: str
) -> Task:
    return Task(
        description=get_question_task_description(display_name, total_questions, experience, difficulty, mandatory, excluded),
        expected_output=f"Exactly {total_questions} technical interview questions.",
        agent=agent,
        context=[plan_task]
    )
