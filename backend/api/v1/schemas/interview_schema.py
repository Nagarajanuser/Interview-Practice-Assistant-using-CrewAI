from typing import Optional, List
from pydantic import BaseModel

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
