from typing import Optional, List
from pydantic import BaseModel

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

class DeleteSessionRequest(BaseModel):
    interview_session_id: str

class DeleteSessionResponse(BaseModel):
    status: str
    message: str
    interview_session_id: str
