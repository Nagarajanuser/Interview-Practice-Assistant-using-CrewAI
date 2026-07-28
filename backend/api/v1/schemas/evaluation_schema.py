from typing import Optional, List
from pydantic import BaseModel, Field
from backend.api.v1.schemas.interview_schema import QuestionDetail

class UserAnswerItem(BaseModel):
    question_id: Optional[int] = None
    question_no: Optional[int] = None
    question: Optional[str] = None
    user_answer: str

class QuestionEvaluationItem(BaseModel):
    question_no: int
    score: float = Field(..., description="Score out of 10")
    feedback: str = Field(..., description="Evaluation feedback explaining the score")

class InterviewEvaluationOutput(BaseModel):
    evaluations: List[QuestionEvaluationItem]

class SubmitAnswerRequest(BaseModel):
    interview_session_id: str
    answers: List[UserAnswerItem]

class SubmitAnswerResponse(BaseModel):
    status: str
    message: str
    interview_session_id: str
    interview_status: str
    total_score: Optional[float] = None
    evaluations: List[QuestionEvaluationItem] = []

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
