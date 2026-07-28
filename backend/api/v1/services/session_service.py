from backend.core.logger import logger
from backend.repositories.session_repository import SessionRepository
from backend.repositories.interview_repository import InterviewRepository
from backend.api.v1.schemas.interview_schema import GetQuestionsRequest, SessionQuestionsResponse, QuestionDetail
from backend.api.v1.schemas.session_schema import (
    GetSessionsRequest, GetSessionsResponse, SessionDetail, DeleteSessionRequest, DeleteSessionResponse
)

class SessionService:
    @staticmethod
    def get_interview_questions(request: GetQuestionsRequest) -> SessionQuestionsResponse:
        session_id = request.interview_session_id.strip()
        logger.info(f"Fetching questions for interview_session_id: {session_id}")
        try:
            questions_data = InterviewRepository.fetch_questions_by_session_id_db(session_id)

            if not questions_data:
                return SessionQuestionsResponse(
                    status="SUCCESS",
                    message="No questions found for the given interview session ID",
                    interview_session_id=session_id,
                    total_questions=0,
                    questions=[]
                )

            # Update session status to 'Inprogress' when questions are fetched
            SessionRepository.update_interview_session_status_db(session_id=session_id, interview_status="Inprogress")

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

    @staticmethod
    def get_interview_sessions(request: GetSessionsRequest = GetSessionsRequest()) -> GetSessionsResponse:
        page = request.page if request and request.page >= 1 else 1
        limit = request.limit if request and request.limit >= 1 else 10
        logger.info(f"Fetching interview sessions via POST - page: {page}, limit: {limit}")

        try:
            sessions_data, total_sessions = SessionRepository.fetch_interview_sessions_db(page=page, limit=limit)
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

    @staticmethod
    def delete_interview_session(request: DeleteSessionRequest) -> DeleteSessionResponse:
        session_id = request.interview_session_id.strip()
        logger.info(f"Deleting interview session: {session_id}")
        try:
            success = SessionRepository.delete_interview_session_db(session_id)
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
