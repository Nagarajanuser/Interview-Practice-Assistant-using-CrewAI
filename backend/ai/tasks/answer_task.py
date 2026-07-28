from crewai import Task, Agent
from backend.ai.prompts.answer_prompt import get_answer_task_description

def create_answer_task(
    agent: Agent,
    question_task: Task,
    total_questions: int,
    difficulty: str
) -> Task:
    return Task(
        description=get_answer_task_description(total_questions, difficulty),
        expected_output=f"Exactly {total_questions} questions with detailed ideal answers.",
        agent=agent,
        context=[question_task]
    )
