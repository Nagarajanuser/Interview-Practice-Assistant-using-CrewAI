from typing import Optional
from pydantic import BaseModel

class InterviewSessionModel(BaseModel):
    interview_session_id: str
    role: str
    experience: int
    duration: int
    total_questions: int
    created_at: Optional[str] = None
    status: str
    interview_status: Optional[str] = "Not started"
    total_score: Optional[float] = None
