from crewai import Task, Agent
from backend.ai.prompts.qa_prompt import get_qa_task_description

def create_qa_task(
    agent: Agent,
    plan_task: Task,
    question_task: Task,
    answer_task: Task,
    mandatory: str,
    excluded: str,
    difficulty: str,
    experience: int,
    total_questions: int,
    output_schema: type
) -> Task:
    return Task(
        description=get_qa_task_description(mandatory, excluded, difficulty, experience, total_questions),
        expected_output=f"A validated InterviewPlanOutput containing exactly {total_questions} questions.",
        agent=agent,
        context=[plan_task, question_task, answer_task],
        output_pydantic=output_schema
    )
