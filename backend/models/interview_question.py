from typing import Optional
from pydantic import BaseModel

class InterviewQuestionModel(BaseModel):
    id: Optional[int] = None
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
