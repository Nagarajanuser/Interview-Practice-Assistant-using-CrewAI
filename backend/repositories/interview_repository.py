from typing import List, Any
from backend.core.database import get_db_connection, ensure_db_schema

class InterviewRepository:
    @staticmethod
    def save_interview_questions_db(session_id: str, questions: List[Any]):
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            query = """
                INSERT INTO interview_questions
                (interview_session_id, question_no, question, answer, difficulty, topic)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            data = [
                (
                    session_id,
                    q.question_no,
                    q.question,
                    q.answer,
                    q.difficulty,
                    q.topic
                )
                for q in questions
            ]
            cursor.executemany(query, data)
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def fetch_questions_by_session_id_db(session_id: str) -> List[dict]:
        ensure_db_schema()
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT id, interview_session_id, question_no, question, answer, user_answer, score, feedback, difficulty, topic, created_at
                FROM interview_questions
                WHERE interview_session_id = %s
                ORDER BY question_no ASC
            """
            cursor.execute(query, (session_id,))
            rows = cursor.fetchall()
            for row in rows:
                if row.get("created_at"):
                    row["created_at"] = str(row["created_at"])
            return rows
        finally:
            cursor.close()
            conn.close()
