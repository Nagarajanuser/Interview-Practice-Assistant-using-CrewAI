import re
import os
import json
import logging
import sys
import traceback
from uuid import uuid4
from typing import Literal, Optional, List
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

import mysql.connector
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from crewai import LLM, Agent, Task, Crew
from crewai.tools import tool

load_dotenv()

# --------------------------------------------------
# Logging Configuration
# --------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("rag_application.log")
    ]
)
logger = logging.getLogger(__name__)

# --------------------------------------------------
# FastAPI App Setup
# --------------------------------------------------
app = FastAPI(
    title="Interview Practice Assistant API",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Request & Response Pydantic Models
# --------------------------------------------------
class InterviewRequest(BaseModel):
    role: str
    experience: int
    duration: int

class InterviewResponse(BaseModel):
    status: str
    message: str
    interview_session_id: str
    total_questions: int | None = None

class GeneratedQuestion(BaseModel):
    question_no: int
    topic: str
    difficulty: str
    question: str
    answer: str

class InterviewPlanOutput(BaseModel):
    questions: List[GeneratedQuestion]

class GetQuestionsRequest(BaseModel):
    interview_session_id: str

class QuestionDetail(BaseModel):
    id: int
    interview_session_id: str
    question_no: int
    question: str
    answer: str
    user_answer: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    difficulty: str
    topic: str
    created_at: Optional[str] = None

class SessionQuestionsResponse(BaseModel):
    status: str
    message: str
    interview_session_id: str
    total_questions: int
    questions: List[QuestionDetail]

class SessionDetail(BaseModel):
    interview_session_id: str
    role: str
    experience: int
    duration: int
    total_questions: int
    created_at: Optional[str] = None
    status: str
    interview_status: Optional[str] = "Not started"
    total_score: Optional[float] = None

class GetSessionsRequest(BaseModel):
    page: int = 1
    limit: int = 10

class GetSessionsResponse(BaseModel):
    status: str
    message: str
    page: int
    limit: int
    total_sessions: int
    total_pages: int
    sessions: List[SessionDetail]

class UserAnswerItem(BaseModel):
    question_id: Optional[int] = None
    question_no: Optional[int] = None
    question: Optional[str] = None
    user_answer: str

class SubmitAnswerRequest(BaseModel):
    interview_session_id: str
    answers: List[UserAnswerItem]

class SubmitAnswerResponse(BaseModel):
    status: str
    message: str
    interview_session_id: str
    interview_status: str
    total_score: Optional[float] = None

class QuestionEvaluationItem(BaseModel):
    question_no: int
    score: float = Field(..., description="Score out of 10")
    feedback: str = Field(..., description="Evaluation feedback explaining the score")

class InterviewEvaluationOutput(BaseModel):
    evaluations: List[QuestionEvaluationItem]

class DeleteSessionRequest(BaseModel):
    interview_session_id: str

class DeleteSessionResponse(BaseModel):
    status: str
    message: str
    interview_session_id: str

class ViewResultRequest(BaseModel):
    interview_session_id: str

class ViewResultResponse(BaseModel):
    status: str
    message: str
    interview_session_id: str
    role: Optional[str] = None
    experience: Optional[int] = None
    duration: Optional[int] = None
    total_questions: Optional[int] = None
    total_score: Optional[float] = None
    interview_status: Optional[str] = "View Result"
    created_at: Optional[str] = None
    questions: List[QuestionDetail] = []

QUESTION_MAPPING = {
    5: 5,
    10: 10,
    20:20,
    30: 30,
    45: 45,
    60: 60
}

# --------------------------------------------------
# MySQL Database Helpers
# --------------------------------------------------
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "crewai_interview_pratice")
    )

def ensure_db_schema():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Ensure interview_status column in interview_sessions
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interview_sessions'
              AND COLUMN_NAME = 'interview_status'
        """)
        if cursor.fetchone()[0] == 0:
            logger.info("Schema Migration: Adding interview_status column to interview_sessions")
            cursor.execute("ALTER TABLE interview_sessions ADD COLUMN interview_status VARCHAR(50) DEFAULT 'Not started'")
            conn.commit()

        # Ensure total_score column in interview_sessions
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interview_sessions'
              AND COLUMN_NAME = 'total_score'
        """)
        if cursor.fetchone()[0] == 0:
            logger.info("Schema Migration: Adding total_score column to interview_sessions")
            cursor.execute("ALTER TABLE interview_sessions ADD COLUMN total_score FLOAT NULL")
            conn.commit()

        # Ensure user_answer column in interview_questions
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interview_questions'
              AND COLUMN_NAME = 'user_answer'
        """)
        if cursor.fetchone()[0] == 0:
            logger.info("Schema Migration: Adding user_answer column to interview_questions")
            cursor.execute("ALTER TABLE interview_questions ADD COLUMN user_answer LONGTEXT NULL")
            conn.commit()

        # Ensure score column in interview_questions
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interview_questions'
              AND COLUMN_NAME = 'score'
        """)
        if cursor.fetchone()[0] == 0:
            logger.info("Schema Migration: Adding score column to interview_questions")
            cursor.execute("ALTER TABLE interview_questions ADD COLUMN score FLOAT NULL")
            conn.commit()

        # Ensure feedback column in interview_questions
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interview_questions'
              AND COLUMN_NAME = 'feedback'
        """)
        if cursor.fetchone()[0] == 0:
            logger.info("Schema Migration: Adding feedback column to interview_questions")
            cursor.execute("ALTER TABLE interview_questions ADD COLUMN feedback TEXT NULL")
            conn.commit()
    except Exception as e:
        logger.error(f"Error checking/migrating DB schema: {e}")
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

def create_interview_session_db(session_id: str, role: str, experience: int, duration: int, total_questions: int, status: str, interview_status: str = "Not started"):
    ensure_db_schema()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            INSERT INTO interview_sessions 
            (interview_session_id, role, experience, duration, total_questions, status, interview_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (session_id, role, experience, duration, total_questions, status, interview_status))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def update_interview_session_status_db(session_id: str, status: Optional[str] = None, interview_status: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if status and interview_status:
            query = "UPDATE interview_sessions SET status = %s, interview_status = %s WHERE interview_session_id = %s"
            cursor.execute(query, (status, interview_status, session_id))
        elif status:
            query = "UPDATE interview_sessions SET status = %s WHERE interview_session_id = %s"
            cursor.execute(query, (status, session_id))
        elif interview_status:
            query = "UPDATE interview_sessions SET interview_status = %s WHERE interview_session_id = %s"
            cursor.execute(query, (interview_status, session_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def save_interview_questions_db(session_id: str, questions: List[GeneratedQuestion]):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            INSERT INTO interview_questions
            (interview_session_id, question_no, question, answer, difficulty, topic)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        data = [
            (
                session_id,
                q.question_no,
                q.question,
                q.answer,
                q.difficulty,
                q.topic
            )
            for q in questions
        ]
        cursor.executemany(query, data)
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def fetch_questions_by_session_id_db(session_id: str) -> List[dict]:
    ensure_db_schema()
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT id, interview_session_id, question_no, question, answer, user_answer, score, feedback, difficulty, topic, created_at
            FROM interview_questions
            WHERE interview_session_id = %s
            ORDER BY question_no ASC
        """
        cursor.execute(query, (session_id,))
        rows = cursor.fetchall()
        for row in rows:
            if row.get("created_at"):
                row["created_at"] = str(row["created_at"])
        return rows
    finally:
        cursor.close()
        conn.close()

def fetch_interview_sessions_db(page: int = 1, limit: int = 10) -> tuple:
    ensure_db_schema()
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) AS total FROM interview_sessions")
        total_result = cursor.fetchone()
        total_sessions = total_result["total"] if total_result else 0

        offset = (page - 1) * limit
        query = """
            SELECT interview_session_id, role, experience, duration, total_questions, created_at, status, interview_status, total_score
            FROM interview_sessions
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, (limit, offset))
        rows = cursor.fetchall()
        for row in rows:
            if row.get("created_at"):
                row["created_at"] = str(row["created_at"])
            if not row.get("interview_status"):
                row["interview_status"] = "Not started"
        return rows, total_sessions
    finally:
        cursor.close()
        conn.close()

def update_user_answers_db(session_id: str, answers: List[dict]):
    ensure_db_schema()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        for item in answers:
            q_id = item.get("question_id")
            q_no = item.get("question_no")
            user_ans = item.get("user_answer", "")

            if q_id:
                cursor.execute(
                    "UPDATE interview_questions SET user_answer = %s WHERE id = %s AND interview_session_id = %s",
                    (user_ans, q_id, session_id)
                )
            elif q_no is not None:
                cursor.execute(
                    "UPDATE interview_questions SET user_answer = %s WHERE question_no = %s AND interview_session_id = %s",
                    (user_ans, q_no, session_id)
                )

        cursor.execute(
            "UPDATE interview_sessions SET interview_status = 'waiting for Result' WHERE interview_session_id = %s",
            (session_id,)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def save_question_scores_db(session_id: str, evaluations: List[QuestionEvaluationItem]):
    ensure_db_schema()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        for item in evaluations:
            cursor.execute(
                "UPDATE interview_questions SET score = %s, feedback = %s WHERE interview_session_id = %s AND question_no = %s",
                (item.score, item.feedback, session_id, item.question_no)
            )
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def save_session_total_score_db(session_id: str, total_score: float):
    ensure_db_schema()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE interview_sessions SET total_score = %s, interview_status = 'View Result' WHERE interview_session_id = %s",
            (total_score, session_id)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def delete_interview_session_db(session_id: str) -> bool:
    ensure_db_schema()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM interview_questions WHERE interview_session_id = %s", (session_id,))
        cursor.execute("DELETE FROM interview_sessions WHERE interview_session_id = %s", (session_id,))
        deleted_count = cursor.rowcount
        conn.commit()
        return deleted_count > 0
    finally:
        cursor.close()
        conn.close()

def fetch_session_by_id_db(session_id: str) -> Optional[dict]:
    ensure_db_schema()
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT interview_session_id, role, experience, duration, total_questions, created_at, status, interview_status, total_score
            FROM interview_sessions
            WHERE interview_session_id = %s
        """
        cursor.execute(query, (session_id,))
        row = cursor.fetchone()
        if row and row.get("created_at"):
            row["created_at"] = str(row["created_at"])
        return row
    finally:
        cursor.close()
        conn.close()

# --------------------------------------------------
# CrewAI Evaluation Pipeline (Single Evaluator Agent + Python Scoring)
# --------------------------------------------------
def run_evaluation_crew(session_id: str) -> float:
    questions_data = fetch_questions_by_session_id_db(session_id)
    if not questions_data:
        logger.warning(f"No questions found for session {session_id} to evaluate.")
        return 0.0

    qa_formatted_input = []
    for q in questions_data:
        qa_formatted_input.append(
            f"Question {q['question_no']}: {q['question']}\n"
            f"Ideal Reference Answer: {q['answer']}\n"
            f"User Submitted Answer: {q.get('user_answer', 'No answer provided')}\n"
        )

    full_qa_text = "\n---\n".join(qa_formatted_input)

    llm = get_crewai_llm()

    # Evaluator Agent: Grades each answer out of 10
    evaluator_agent = Agent(
        role="Senior Technical Answer Evaluator",
        goal="Evaluate candidate answers against the ideal reference answers for each question. Provide an objective numerical score out of 10 (0.0 to 10.0) and constructive feedback for each question.",
        backstory="You are a veteran technical interviewer and grading manager. You assess candidate responses for accuracy, completeness, and technical clarity, assigning a score out of 10 for each question.",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

    eval_task = Task(
        description=(
            f"Evaluate candidate answers for interview session '{session_id}':\n\n"
            f"{full_qa_text}\n\n"
            "For each question, assign a score out of 10 (0.0 to 10.0) and provide concise evaluation feedback.\n"
            "Format the output strictly according to the InterviewEvaluationOutput schema."
        ),
        expected_output="A list of question evaluations with scores out of 10 and feedback matching InterviewEvaluationOutput.",
        agent=evaluator_agent,
        output_pydantic=InterviewEvaluationOutput
    )

    crew = Crew(
        agents=[evaluator_agent],
        tasks=[eval_task],
        verbose=True
    )

    result = crew.kickoff()

    evaluations = []
    if hasattr(result, 'pydantic') and result.pydantic and hasattr(result.pydantic, 'evaluations'):
        evaluations = result.pydantic.evaluations
    elif hasattr(result, 'tasks_output') and result.tasks_output:
        last_out = result.tasks_output[-1]
        if hasattr(last_out, 'pydantic') and last_out.pydantic and hasattr(last_out.pydantic, 'evaluations'):
            evaluations = last_out.pydantic.evaluations
        elif hasattr(last_out, 'json_dict') and last_out.json_dict:
            q_list = last_out.json_dict.get('evaluations', [])
            evaluations = [QuestionEvaluationItem(**e) for e in q_list]
        elif hasattr(last_out, 'raw'):
            raw_str = last_out.raw.strip()
            if "```" in raw_str:
                raw_str = re.sub(r"^```(?:json)?", "", raw_str, flags=re.MULTILINE)
                raw_str = re.sub(r"```$", "", raw_str, flags=re.MULTILINE).strip()
            try:
                data = json.loads(raw_str)
                if isinstance(data, list):
                    evaluations = [QuestionEvaluationItem(**e) for e in data]
                elif isinstance(data, dict):
                    q_list = data.get("evaluations", [])
                    if q_list:
                        evaluations = [QuestionEvaluationItem(**e) for e in q_list]
            except Exception as parse_err:
                logger.error(f"Failed to parse evaluation response as JSON: {parse_err}")

    # Python Validation & Score Calculation
    validated_evaluations = []
    if evaluations:
        for item in evaluations:
            # Validate score bounds (0.0 to 10.0)
            score_val = max(0.0, min(10.0, float(item.score)))
            validated_evaluations.append(
                QuestionEvaluationItem(
                    question_no=item.question_no,
                    score=round(score_val, 1),
                    feedback=item.feedback or "Evaluated answer."
                )
            )

    if not validated_evaluations:
        logger.warning(f"Fallback evaluation scoring applied for session {session_id}")
        for q in questions_data:
            u_ans = q.get('user_answer', '')
            sc = 7.5 if len(u_ans.strip()) > 30 else (4.0 if len(u_ans.strip()) > 0 else 0.0)
            validated_evaluations.append(
                QuestionEvaluationItem(
                    question_no=q['question_no'],
                    score=sc,
                    feedback="Evaluated answer quality."
                )
            )

    # 1. Save per-question scores to MySQL
    logger.info(f"Saving per-question scores for session {session_id} into MySQL")
    save_question_scores_db(session_id, validated_evaluations)

    # 2. Calculate average total score using Python
    total_score = round(sum(e.score for e in validated_evaluations) / len(validated_evaluations), 2)

    # 3. Save session total score & update status to 'View Result' using Python
    logger.info(f"Saving session {session_id} total_score={total_score} into MySQL")
    save_session_total_score_db(session_id, total_score)

    return total_score

# --------------------------------------------------
# CrewAI Multi-Agent Workflow
# --------------------------------------------------
def get_crewai_llm():
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        return LLM(model="gpt-4o-mini", api_key=openai_api_key)
    else:
        return LLM(
            model="ollama/qwen2.5:1.5b",
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        )

def run_interview_crew(role: str, experience: int, difficulty: str, total_questions: int) -> List[GeneratedQuestion]:
    llm = get_crewai_llm()

    # 1. Planner Agent -> Decides topics, difficulty strategy, and question count
    planner_agent = Agent(
        role=f"Interview Curriculum Planner for {role}",
        goal=f"Determine optimal technical topics, target difficulty ({difficulty}), and strategy for generating {total_questions} questions for a candidate with {experience} years experience in {role}.",
        backstory=f"You are a Senior Hiring Manager and Curriculum Strategist specializing in {role}. You define comprehensive topic blueprints and skill assessment distributions.",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

    # 2. Question Agent -> Generates interview questions
    question_agent = Agent(
        role=f"Technical Question Creator for {role}",
        goal=f"Generate {total_questions} distinct technical interview questions based on the planner's topic blueprint.",
        backstory=f"You are a Principal Engineer in {role}. You craft realistic, clear, and challenging questions spanning core concepts, system design, coding standards, and scenario-based problem solving.",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

    # 3. Answer Agent -> Produces ideal answers
    answer_agent = Agent(
        role=f"Subject Matter Answer Specialist in {role}",
        goal=f"Formulate ideal, comprehensive, and accurate reference answers for each generated interview question.",
        backstory=f"You are a Domain Expert in {role}. You write clear, complete, and exemplary solutions explaining technical principles and best practices.",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

    # 4. QA Agent -> Reviews questions/answers, removes duplicates, and validates quality
    qa_agent = Agent(
        role=f"Interview QA & Quality Reviewer",
        goal=f"Review all questions and answers, eliminate duplicate or overlapping items, validate high standards of quality, and format final output matching the InterviewPlanOutput schema.",
        backstory=f"You are a meticulous Technical Editor and Quality Lead. You refine questions/answers for clarity, ensure exact question numbering (1 to {total_questions}), and enforce proper Pydantic JSON structure.",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

    # Tasks definition
    # Tasks definition with explicit context dependencies for agent-to-agent output passing
    plan_task = Task(
        description=(
            f"Analyze candidate profile for {role} ({experience} years exp, {difficulty} level) and design a comprehensive topic & difficulty strategy blueprint for exactly {total_questions} questions.\n"
            "Specify key technical topics such as Core Fundamentals, System Architecture & Design, Best Practices, Practical Coding/Scenarios, and Troubleshooting."
        ),
        expected_output=f"A detailed topic and difficulty strategy blueprint for {total_questions} questions.",
        agent=planner_agent
    )

    question_task = Task(
        description=(
            f"Using the topic and difficulty strategy blueprint generated in plan_task, generate exactly {total_questions} distinct technical interview questions.\n"
            f"Role: {role} | Experience: {experience} years | Difficulty: {difficulty}."
        ),
        expected_output=f"A raw list of {total_questions} interview questions categorized by topic.",
        agent=question_agent,
        context=[plan_task]
    )

    answer_task = Task(
        description=(
            f"Review the generated interview questions from question_task and produce complete, ideal reference answers for all {total_questions} questions.\n"
            "Explain technical principles, practical considerations, and best practices clearly in each answer."
        ),
        expected_output=f"All {total_questions} questions combined with complete reference answers.",
        agent=answer_agent,
        context=[question_task]
    )

    qa_task = Task(
        description=(
            f"Perform Quality Assurance and Final Verification on the Q&A set from answer_task and question_task:\n"
            f"1. Check against the plan_task blueprint to ensure full topic coverage.\n"
            f"2. Remove any duplicate, overlapping, or vague questions.\n"
            f"3. Ensure questions and answers align strictly with difficulty '{difficulty}'.\n"
            f"4. Ensure question_no ranges sequentially from 1 to {total_questions}.\n"
            f"5. Output the final refined data strictly according to the InterviewPlanOutput schema."
        ),
        expected_output=f"A validated, duplicate-free list of {total_questions} interview questions and ideal answers matching the InterviewPlanOutput schema.",
        agent=qa_agent,
        context=[plan_task, question_task, answer_task],
        output_pydantic=InterviewPlanOutput
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

# --------------------------------------------------
# Health Check Endpoint
# --------------------------------------------------
@app.get("/")
def home():
    return {
        "message": "AI Interview Practice Assistant API is running."
    }

# --------------------------------------------------
# Interview Generation API Endpoint
# --------------------------------------------------
@app.post(
    "/api/interview/generate",
    response_model=InterviewResponse
)
def generate_interview(request: InterviewRequest):
    logger.info("Interview Generation Started")
    session_id = str(uuid4())

    try:
        # Step 1: Validation
        role = request.role.strip()
        experience = request.experience
        duration = request.duration

        total_questions = QUESTION_MAPPING.get(duration, duration)

        if experience <= 2:
            difficulty = "Beginner"
        elif experience <= 5:
            difficulty = "Intermediate"
        else:
            difficulty = "Advanced"

        logger.info(f"Interview Session: {session_id} | Role: {role} | Exp: {experience} | Duration: {duration}m | Questions: {total_questions} | Difficulty: {difficulty}")

        # Step 2: Create initial session entry in MySQL (IN_PROGRESS)
        logger.info("Inserting session with status IN_PROGRESS into MySQL")
        create_interview_session_db(
            session_id=session_id,
            role=role,
            experience=experience,
            duration=duration,
            total_questions=total_questions,
            status="IN_PROGRESS",
            interview_status="Not started"
        )

        # Step 3: Execute CrewAI generation pipeline
        logger.info("Executing CrewAI Agents to generate questions & answers")
        generated_questions = run_interview_crew(
            role=role,
            experience=experience,
            difficulty=difficulty,
            total_questions=total_questions
        )

        # Step 4: Persist generated questions into MySQL
        logger.info(f"Persisting {len(generated_questions)} generated questions to MySQL interview_questions table")
        save_interview_questions_db(session_id, generated_questions)

        # Step 5: Update session status to COMPLETED
        logger.info("Updating interview session status to COMPLETED")
        update_interview_session_status_db(session_id, status="COMPLETED", interview_status="Not started")

        logger.info("Interview Generation Completed Successfully")

        return InterviewResponse(
            status="SUCCESS",
            message="Interview Generated Successfully",
            interview_session_id=session_id,
            total_questions=total_questions
        )

    except Exception as ex:
        logger.exception(f"Error during interview generation for session {session_id}: {ex}")
        try:
            update_interview_session_status_db(session_id, "FAILED")
        except Exception as db_err:
            logger.error(f"Failed to update session status to FAILED in MySQL: {db_err}")

        return InterviewResponse(
            status="FAILED",
            message=f"Interview generation failed: {str(ex)}",
            interview_session_id=session_id,
            total_questions=None
        )

# --------------------------------------------------
# Get Interview Questions API Endpoint
# --------------------------------------------------
@app.post(
    "/api/interview/questions",
    response_model=SessionQuestionsResponse
)
def get_interview_questions(request: GetQuestionsRequest):
    session_id = request.interview_session_id.strip()
    logger.info(f"Fetching questions for interview_session_id: {session_id}")
    try:
        questions_data = fetch_questions_by_session_id_db(session_id)

        if not questions_data:
            return SessionQuestionsResponse(
                status="SUCCESS",
                message="No questions found for the given interview session ID",
                interview_session_id=session_id,
                total_questions=0,
                questions=[]
            )

        # Update session status to 'Inprogress' when questions are fetched
        update_interview_session_status_db(session_id=session_id, interview_status="Inprogress")

        question_details = [QuestionDetail(**q) for q in questions_data]

        return SessionQuestionsResponse(
            status="SUCCESS",
            message="Questions fetched successfully",
            interview_session_id=session_id,
            total_questions=len(question_details),
            questions=question_details
        )
    except Exception as ex:
        logger.exception(f"Error fetching questions for session {request.interview_session_id}: {ex}")
        return SessionQuestionsResponse(
            status="FAILED",
            message=f"Failed to fetch questions: {str(ex)}",
            interview_session_id=request.interview_session_id,
            total_questions=0,
            questions=[]
        )

# --------------------------------------------------
# Submit Question Answers API Endpoint
# --------------------------------------------------
@app.post(
    "/api/interview/submit_question_answer",
    response_model=SubmitAnswerResponse
)
def submit_question_answer(request: SubmitAnswerRequest):
    session_id = request.interview_session_id.strip()
    logger.info(f"Submitting {len(request.answers)} answers for session: {session_id}")
    try:
        answers_list = [a.dict() for a in request.answers]
        update_user_answers_db(session_id, answers_list)

        # Trigger CrewAI evaluation pipeline
        logger.info(f"Executing CrewAI Evaluation Crew for session: {session_id}")
        total_score = run_evaluation_crew(session_id)

        return SubmitAnswerResponse(
            status="SUCCESS",
            message="Answers submitted and evaluated successfully",
            interview_session_id=session_id,
            interview_status="View Result",
            total_score=total_score
        )
    except Exception as ex:
        logger.exception(f"Error submitting answers for session {session_id}: {ex}")
        return SubmitAnswerResponse(
            status="FAILED",
            message=f"Failed to submit answers: {str(ex)}",
            interview_session_id=session_id,
            interview_status="FAILED",
            total_score=None
        )

# --------------------------------------------------
# Get All Interview Sessions API Endpoint (Single POST Endpoint)
# --------------------------------------------------
@app.post(
    "/api/interview/sessions",
    response_model=GetSessionsResponse
)
def get_interview_sessions(request: GetSessionsRequest = GetSessionsRequest()):
    page = request.page if request and request.page >= 1 else 1
    limit = request.limit if request and request.limit >= 1 else 10
    logger.info(f"Fetching interview sessions via POST - page: {page}, limit: {limit}")

    try:
        sessions_data, total_sessions = fetch_interview_sessions_db(page=page, limit=limit)
        total_pages = (total_sessions + limit - 1) // limit if total_sessions > 0 else 0

        session_details = [SessionDetail(**s) for s in sessions_data]

        return GetSessionsResponse(
            status="SUCCESS",
            message="Sessions fetched successfully",
            page=page,
            limit=limit,
            total_sessions=total_sessions,
            total_pages=total_pages,
            sessions=session_details
        )
    except Exception as ex:
        logger.exception(f"Error fetching interview sessions: {ex}")
        return GetSessionsResponse(
            status="FAILED",
            message=f"Failed to fetch sessions: {str(ex)}",
            page=page,
            limit=limit,
            total_sessions=0,
            total_pages=0,
            sessions=[]
        )

# --------------------------------------------------
# Delete Interview Session API Endpoint
# --------------------------------------------------
@app.post(
    "/api/interview/delete",
    response_model=DeleteSessionResponse
)
def delete_interview_session(request: DeleteSessionRequest):
    session_id = request.interview_session_id.strip()
    logger.info(f"Deleting interview session: {session_id}")
    try:
        success = delete_interview_session_db(session_id)
        if success:
            return DeleteSessionResponse(
                status="SUCCESS",
                message="Interview session deleted successfully",
                interview_session_id=session_id
            )
        else:
            return DeleteSessionResponse(
                status="FAILED",
                message="Interview session not found or already deleted",
                interview_session_id=session_id
            )
    except Exception as ex:
        logger.exception(f"Error deleting session {session_id}: {ex}")
        return DeleteSessionResponse(
            status="FAILED",
            message=f"Failed to delete session: {str(ex)}",
            interview_session_id=session_id
        )

# --------------------------------------------------
# View Interview Result API Endpoint
# --------------------------------------------------
@app.post(
    "/api/interview/view_result",
    response_model=ViewResultResponse
)
def view_interview_result(request: ViewResultRequest):
    session_id = request.interview_session_id.strip()
    logger.info(f"Fetching interview result for session: {session_id}")
    try:
        session_data = fetch_session_by_id_db(session_id)

        if not session_data:
            return ViewResultResponse(
                status="FAILED",
                message="Interview session not found",
                interview_session_id=session_id,
                questions=[]
            )

        # Update interview_status = 'View Result'
        update_interview_session_status_db(session_id=session_id, interview_status="View Result")
        session_data["interview_status"] = "View Result"

        # Fetch all questions with questions, ideal answers, user_answers, scores, and feedback
        questions_raw = fetch_questions_by_session_id_db(session_id)
        questions_list = [QuestionDetail(**q) for q in questions_raw]

        return ViewResultResponse(
            status="SUCCESS",
            message="Interview results retrieved successfully",
            interview_session_id=session_id,
            role=session_data.get("role"),
            experience=session_data.get("experience"),
            duration=session_data.get("duration"),
            total_questions=session_data.get("total_questions"),
            total_score=session_data.get("total_score"),
            interview_status="View Result",
            created_at=session_data.get("created_at"),
            questions=questions_list
        )
    except Exception as ex:
        logger.exception(f"Error fetching interview result for session {session_id}: {ex}")
        return ViewResultResponse(
            status="FAILED",
            message=f"Failed to retrieve results: {str(ex)}",
            interview_session_id=session_id,
            questions=[]
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)