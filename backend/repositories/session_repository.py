from typing import Optional, List, Tuple
from backend.core.database import get_db_connection, ensure_db_schema

class SessionRepository:
    @staticmethod
    def create_interview_session_db(session_id: str, role: str, experience: int, duration: int, total_questions: int, status: str, interview_status: str = "Not started"):
        ensure_db_schema()
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            query = """
                INSERT INTO interview_sessions 
                (interview_session_id, role, experience, duration, total_questions, status, interview_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (session_id, role, experience, duration, total_questions, status, interview_status))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def update_interview_session_status_db(session_id: str, status: Optional[str] = None, interview_status: Optional[str] = None):
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            if status and interview_status:
                query = "UPDATE interview_sessions SET status = %s, interview_status = %s WHERE interview_session_id = %s"
                cursor.execute(query, (status, interview_status, session_id))
            elif status:
                query = "UPDATE interview_sessions SET status = %s WHERE interview_session_id = %s"
                cursor.execute(query, (status, session_id))
            elif interview_status:
                query = "UPDATE interview_sessions SET interview_status = %s WHERE interview_session_id = %s"
                cursor.execute(query, (interview_status, session_id))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def fetch_interview_sessions_db(page: int = 1, limit: int = 10) -> Tuple[List[dict], int]:
        ensure_db_schema()
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT COUNT(*) AS total FROM interview_sessions")
            total_result = cursor.fetchone()
            total_sessions = total_result["total"] if total_result else 0

            offset = (page - 1) * limit
            query = """
                SELECT interview_session_id, role, experience, duration, total_questions, created_at, status, interview_status, total_score
                FROM interview_sessions
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (limit, offset))
            rows = cursor.fetchall()
            for row in rows:
                if row.get("created_at"):
                    row["created_at"] = str(row["created_at"])
                if not row.get("interview_status"):
                    row["interview_status"] = "Not started"
            return rows, total_sessions
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def update_user_answers_db(session_id: str, answers: List[dict]):
        ensure_db_schema()
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            for item in answers:
                q_id = item.get("question_id")
                q_no = item.get("question_no")
                user_ans = item.get("user_answer", "")

                if q_id:
                    cursor.execute(
                        "UPDATE interview_questions SET user_answer = %s WHERE id = %s AND interview_session_id = %s",
                        (user_ans, q_id, session_id)
                    )
                elif q_no is not None:
                    cursor.execute(
                        "UPDATE interview_questions SET user_answer = %s WHERE question_no = %s AND interview_session_id = %s",
                        (user_ans, q_no, session_id)
                    )

            cursor.execute(
                "UPDATE interview_sessions SET interview_status = 'waiting for Result' WHERE interview_session_id = %s",
                (session_id,)
            )
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def delete_interview_session_db(session_id: str) -> bool:
        ensure_db_schema()
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM interview_questions WHERE interview_session_id = %s", (session_id,))
            cursor.execute("DELETE FROM interview_sessions WHERE interview_session_id = %s", (session_id,))
            deleted_count = cursor.rowcount
            conn.commit()
            return deleted_count > 0
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def fetch_session_by_id_db(session_id: str) -> Optional[dict]:
        ensure_db_schema()
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT interview_session_id, role, experience, duration, total_questions, created_at, status, interview_status, total_score
                FROM interview_sessions
                WHERE interview_session_id = %s
            """
            cursor.execute(query, (session_id,))
            row = cursor.fetchone()
            if row and row.get("created_at"):
                row["created_at"] = str(row["created_at"])
            return row
        finally:
            cursor.close()
            conn.close()
