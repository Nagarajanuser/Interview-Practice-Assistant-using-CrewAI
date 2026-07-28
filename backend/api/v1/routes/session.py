from fastapi import APIRouter
from backend.api.v1.schemas.session_schema import (
    GetSessionsRequest, GetSessionsResponse, DeleteSessionRequest, DeleteSessionResponse
)
from backend.api.v1.services.session_service import SessionService

router = APIRouter(prefix="/api/interview", tags=["Session"])

@router.post("/sessions", response_model=GetSessionsResponse)
def get_interview_sessions(request: GetSessionsRequest = GetSessionsRequest()):
    return SessionService.get_interview_sessions(request)

@router.post("/delete", response_model=DeleteSessionResponse)
def delete_interview_session(request: DeleteSessionRequest):
    return SessionService.delete_interview_session(request)
