from crewai import Task, Agent
from backend.ai.prompts.evaluation_prompt import get_evaluation_task_description

def create_evaluation_task(
    agent: Agent,
    session_id: str,
    full_qa_text: str,
    output_schema: type
) -> Task:
    return Task(
        description=get_evaluation_task_description(session_id, full_qa_text),
        expected_output="A list of question evaluations matching InterviewEvaluationOutput with scores and detailed feedback.",
        agent=agent,
        output_pydantic=output_schema
    )
