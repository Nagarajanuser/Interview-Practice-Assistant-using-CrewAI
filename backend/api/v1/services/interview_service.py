from uuid import uuid4
from backend.core.logger import logger
from backend.core.constants import QUESTION_MAPPING
from backend.repositories.session_repository import SessionRepository
from backend.repositories.interview_repository import InterviewRepository
from backend.ai.crews.interview_crew import run_interview_crew
from backend.api.v1.schemas.interview_schema import InterviewRequest, InterviewResponse

class InterviewService:
    @staticmethod
    def generate_interview(request: InterviewRequest) -> InterviewResponse:
        logger.info("Interview Generation Started")
        session_id = str(uuid4())

        try:
            # Step 1: Validation
            role = request.role.strip()
            experience = request.experience
            duration = request.duration

            total_questions = QUESTION_MAPPING.get(duration, duration)

            if experience <= 2:
                difficulty = "Beginner"
            elif experience <= 5:
                difficulty = "Intermediate"
            else:
                difficulty = "Advanced"

            logger.info(f"Interview Session: {session_id} | Role: {role} | Exp: {experience} | Duration: {duration}m | Questions: {total_questions} | Difficulty: {difficulty}")

            # Step 2: Create initial session entry in MySQL (IN_PROGRESS)
            logger.info("Inserting session with status IN_PROGRESS into MySQL")
            SessionRepository.create_interview_session_db(
                session_id=session_id,
                role=role,
                experience=experience,
                duration=duration,
                total_questions=total_questions,
                status="IN_PROGRESS",
                interview_status="Not started"
            )

            # Step 3: Execute CrewAI generation pipeline
            logger.info("Executing CrewAI Agents to generate questions & answers")
            generated_questions = run_interview_crew(
                role=role,
                experience=experience,
                difficulty=difficulty,
                total_questions=total_questions
            )

            # Step 4: Persist generated questions into MySQL
            logger.info(f"Persisting {len(generated_questions)} generated questions to MySQL interview_questions table")
            InterviewRepository.save_interview_questions_db(session_id, generated_questions)

            # Step 5: Update session status to COMPLETED
            logger.info("Updating interview session status to COMPLETED")
            SessionRepository.update_interview_session_status_db(session_id, status="COMPLETED", interview_status="Not started")

            logger.info("Interview Generation Completed Successfully")

            return InterviewResponse(
                status="SUCCESS",
                message="Interview Generated Successfully",
                interview_session_id=session_id,
                total_questions=total_questions
            )

        except Exception as ex:
            logger.exception(f"Error during interview generation for session {session_id}: {ex}")
            try:
                SessionRepository.update_interview_session_status_db(session_id, "FAILED")
            except Exception as db_err:
                logger.error(f"Failed to update session status to FAILED in MySQL: {db_err}")

            return InterviewResponse(
                status="FAILED",
                message=f"Interview generation failed: {str(ex)}",
                interview_session_id=session_id,
                total_questions=None
            )
