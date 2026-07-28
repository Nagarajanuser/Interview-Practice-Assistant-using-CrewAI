from typing import List, Any
from backend.core.database import get_db_connection, ensure_db_schema

class EvaluationRepository:
    @staticmethod
    def save_question_scores_db(session_id: str, evaluations: List[Any]):
        ensure_db_schema()
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            for item in evaluations:
                cursor.execute(
                    "UPDATE interview_questions SET score = %s, feedback = %s WHERE interview_session_id = %s AND question_no = %s",
                    (item.score, item.feedback, session_id, item.question_no)
                )
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def save_session_total_score_db(session_id: str, total_score: float):
        ensure_db_schema()
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "UPDATE interview_sessions SET total_score = %s, interview_status = 'View Result' WHERE interview_session_id = %s",
                (total_score, session_id)
            )
            conn.commit()
        finally:
            cursor.close()
            conn.close()
