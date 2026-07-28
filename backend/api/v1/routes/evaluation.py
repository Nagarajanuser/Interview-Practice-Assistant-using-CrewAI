from fastapi import APIRouter
from backend.api.v1.schemas.evaluation_schema import (
    SubmitAnswerRequest, SubmitAnswerResponse, ViewResultRequest, ViewResultResponse
)
from backend.api.v1.services.evaluation_service import EvaluationService

router = APIRouter(prefix="/api/interview", tags=["Evaluation"])

@router.post("/submit_question_answer", response_model=SubmitAnswerResponse)
def submit_question_answer(request: SubmitAnswerRequest):
    return EvaluationService.submit_question_answer(request)

@router.post("/view_result", response_model=ViewResultResponse)
def view_interview_result(request: ViewResultRequest):
    return EvaluationService.view_interview_result(request)
