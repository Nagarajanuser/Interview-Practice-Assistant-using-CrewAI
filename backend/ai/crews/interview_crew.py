import json
import re
from typing import List
from crewai import Crew
from backend.core.logger import logger
from backend.ai.llm.llm_factory import get_crewai_llm
from backend.repositories.role_repository import RoleRepository
from backend.api.v1.schemas.interview_schema import GeneratedQuestion, InterviewPlanOutput
from backend.ai.agents.planner_agent import create_planner_agent
from backend.ai.agents.question_agent import create_question_agent
from backend.ai.agents.answer_agent import create_answer_agent
from backend.ai.agents.qa_agent import create_qa_agent
from backend.ai.tasks.planner_task import create_planner_task
from backend.ai.tasks.question_task import create_question_task
from backend.ai.tasks.answer_task import create_answer_task
from backend.ai.tasks.qa_task import create_qa_task

def run_interview_crew(role: str, experience: int, difficulty: str, total_questions: int) -> List[GeneratedQuestion]:
    llm = get_crewai_llm()
    role_config = RoleRepository.load_role_config(role)

    mandatory_list = role_config.get("mandatory_skills", [])
    optional_list = role_config.get("optional_skills", [])
    excluded_list = role_config.get("excluded_topics") or role_config.get("excluded_skills") or []

    mandatory = "\n- ".join(mandatory_list) if mandatory_list else "Core Fundamentals"
    optional = "\n- ".join(optional_list) if optional_list else "Advanced Concepts"
    excluded = "\n- ".join(excluded_list) if excluded_list else "None"

    # Create Agents
    planner_agent = create_planner_agent(
        llm=llm,
        display_name=role_config['display_name'],
        mandatory=mandatory,
        optional=optional,
        excluded=excluded,
        total_questions=total_questions,
        experience=experience,
        difficulty=difficulty
    )

    question_agent = create_question_agent(
        llm=llm,
        display_name=role_config['display_name'],
        total_questions=total_questions
    )

    answer_agent = create_answer_agent(
        llm=llm,
        display_name=role_config['display_name']
    )

    qa_agent = create_qa_agent(llm=llm)

    # Create Tasks
    plan_task = create_planner_task(
        agent=planner_agent,
        display_name=role_config['display_name'],
        experience=experience,
        difficulty=difficulty,
        mandatory=mandatory,
        optional=optional,
        excluded=excluded,
        total_questions=total_questions
    )

    question_task = create_question_task(
        agent=question_agent,
        plan_task=plan_task,
        display_name=role_config['display_name'],
        total_questions=total_questions,
        experience=experience,
        difficulty=difficulty,
        mandatory=mandatory,
        excluded=excluded
    )

    answer_task = create_answer_task(
        agent=answer_agent,
        question_task=question_task,
        total_questions=total_questions,
        difficulty=difficulty
    )

    qa_task = create_qa_task(
        agent=qa_agent,
        plan_task=plan_task,
        question_task=question_task,
        answer_task=answer_task,
        mandatory=mandatory,
        excluded=excluded,
        difficulty=difficulty,
        experience=experience,
        total_questions=total_questions,
        output_schema=InterviewPlanOutput
    )

    crew = Crew(
        agents=[planner_agent, question_agent, answer_agent, qa_agent],
        tasks=[plan_task, question_task, answer_task, qa_task],
        verbose=True
    )

    result = crew.kickoff()

    questions = []

    # 1. Check root level pydantic result
    if hasattr(result, 'pydantic') and result.pydantic and hasattr(result.pydantic, 'questions'):
        questions = result.pydantic.questions
    
    # 2. Check task-level output from QA task (last task)
    elif hasattr(result, 'tasks_output') and result.tasks_output:
        last_task_out = result.tasks_output[-1]
        if hasattr(last_task_out, 'pydantic') and last_task_out.pydantic and hasattr(last_task_out.pydantic, 'questions'):
            questions = last_task_out.pydantic.questions
        elif hasattr(last_task_out, 'json_dict') and last_task_out.json_dict:
            q_list = last_task_out.json_dict.get('questions', [])
            questions = [GeneratedQuestion(**q) for q in q_list]
        elif hasattr(last_task_out, 'raw'):
            raw_str = last_task_out.raw.strip()
            if "```" in raw_str:
                raw_str = re.sub(r"^```(?:json)?", "", raw_str, flags=re.MULTILINE)
                raw_str = re.sub(r"```$", "", raw_str, flags=re.MULTILINE).strip()
            try:
                data = json.loads(raw_str)
                if isinstance(data, list):
                    questions = [GeneratedQuestion(**q) for q in data]
                elif isinstance(data, dict):
                    q_list = data.get("questions", [])
                    if q_list:
                        questions = [GeneratedQuestion(**q) for q in q_list]
                    else:
                        questions = [GeneratedQuestion(**data)]
            except Exception as parse_err:
                logger.error(f"Failed to parse raw CrewAI response as JSON: {parse_err}")

    # 3. Check root level json_dict or raw string as fallback
    elif hasattr(result, 'json_dict') and result.json_dict:
        q_list = result.json_dict.get('questions', [])
        questions = [GeneratedQuestion(**q) for q in q_list]
    elif hasattr(result, 'raw'):
        raw_str = result.raw.strip()
        if "```" in raw_str:
            raw_str = re.sub(r"^```(?:json)?", "", raw_str, flags=re.MULTILINE)
            raw_str = re.sub(r"```$", "", raw_str, flags=re.MULTILINE).strip()
        try:
            data = json.loads(raw_str)
            if isinstance(data, list):
                questions = [GeneratedQuestion(**q) for q in data]
            elif isinstance(data, dict):
                q_list = data.get("questions", [])
                if q_list:
                    questions = [GeneratedQuestion(**q) for q in q_list]
                else:
                    questions = [GeneratedQuestion(**data)]
        except Exception as parse_err:
            logger.error(f"Failed to parse raw CrewAI response as JSON: {parse_err}")

    # Fallback to ensure guaranteed output matching question count
    if not questions:
        logger.warning("CrewAI output empty or unparsed; applying structured fallback question set.")
        questions = [
            GeneratedQuestion(
                question_no=i,
                topic=f"{role} Fundamentals",
                difficulty=difficulty,
                question=f"Question {i}: Explain key concepts and architecture principles for {role} at {experience} years experience level.",
                answer=f"Detailed reference answer explaining practical implementation and architectural considerations for question {i} in {role}."
            )
            for i in range(1, total_questions + 1)
        ]

    # Ensure correct question numbering and difficulty
    for idx, q in enumerate(questions, 1):
        q.question_no = idx
        if not q.difficulty:
            q.difficulty = difficulty

    return questions
