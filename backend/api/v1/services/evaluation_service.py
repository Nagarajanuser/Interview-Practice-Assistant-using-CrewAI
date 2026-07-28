from backend.core.logger import logger
from backend.repositories.session_repository import SessionRepository
from backend.repositories.interview_repository import InterviewRepository
from backend.ai.crews.evaluation_crew import run_evaluation_crew
from backend.api.v1.schemas.interview_schema import QuestionDetail
from backend.api.v1.schemas.evaluation_schema import (
    SubmitAnswerRequest, SubmitAnswerResponse, ViewResultRequest, ViewResultResponse
)

class EvaluationService:
    @staticmethod
    def submit_question_answer(request: SubmitAnswerRequest) -> SubmitAnswerResponse:
        session_id = request.interview_session_id.strip()
        logger.info(f"Submitting {len(request.answers)} answers for session: {session_id}")
        try:
            answers_list = [a.dict() for a in request.answers]
            SessionRepository.update_user_answers_db(session_id, answers_list)

            # Trigger CrewAI evaluation pipeline
            logger.info(f"Executing CrewAI Evaluation Crew for session: {session_id}")
            total_score, evaluations = run_evaluation_crew(session_id)

            return SubmitAnswerResponse(
                status="SUCCESS",
                message="Answers submitted and evaluated successfully",
                interview_session_id=session_id,
                interview_status="View Result",
                total_score=total_score,
                evaluations=evaluations
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

    @staticmethod
    def view_interview_result(request: ViewResultRequest) -> ViewResultResponse:
        session_id = request.interview_session_id.strip()
        logger.info(f"Fetching interview result for session: {session_id}")
        try:
            session_data = SessionRepository.fetch_session_by_id_db(session_id)

            if not session_data:
                return ViewResultResponse(
                    status="FAILED",
                    message="Interview session not found",
                    interview_session_id=session_id,
                    questions=[]
                )

            # Update interview_status = 'View Result'
            SessionRepository.update_interview_session_status_db(session_id=session_id, interview_status="View Result")
            session_data["interview_status"] = "View Result"

            # Fetch all questions with questions, ideal answers, user_answers, scores, and feedback
            questions_raw = InterviewRepository.fetch_questions_by_session_id_db(session_id)
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
