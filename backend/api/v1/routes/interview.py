from fastapi import APIRouter
from backend.api.v1.schemas.interview_schema import (
    InterviewRequest, InterviewResponse, GetQuestionsRequest, SessionQuestionsResponse
)
from backend.api.v1.services.interview_service import InterviewService
from backend.api.v1.services.session_service import SessionService

router = APIRouter(prefix="/api/interview", tags=["Interview"])

@router.post("/generate", response_model=InterviewResponse)
def generate_interview(request: InterviewRequest):
    return InterviewService.generate_interview(request)

@router.post("/questions", response_model=SessionQuestionsResponse)
def get_interview_questions(request: GetQuestionsRequest):
    return SessionService.get_interview_questions(request)
