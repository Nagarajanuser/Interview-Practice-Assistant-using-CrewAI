import mysql.connector
from backend.core.config import settings
from backend.core.logger import logger

def get_db_connection():
    return mysql.connector.connect(
        host=settings.DB_HOST,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME
    )

def ensure_db_schema():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Ensure interview_status column in interview_sessions
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interview_sessions'
              AND COLUMN_NAME = 'interview_status'
        """)
        if cursor.fetchone()[0] == 0:
            logger.info("Schema Migration: Adding interview_status column to interview_sessions")
            cursor.execute("ALTER TABLE interview_sessions ADD COLUMN interview_status VARCHAR(50) DEFAULT 'Not started'")
            conn.commit()

        # Ensure total_score column in interview_sessions
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interview_sessions'
              AND COLUMN_NAME = 'total_score'
        """)
        if cursor.fetchone()[0] == 0:
            logger.info("Schema Migration: Adding total_score column to interview_sessions")
            cursor.execute("ALTER TABLE interview_sessions ADD COLUMN total_score FLOAT NULL")
            conn.commit()

        # Ensure user_answer column in interview_questions
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interview_questions'
              AND COLUMN_NAME = 'user_answer'
        """)
        if cursor.fetchone()[0] == 0:
            logger.info("Schema Migration: Adding user_answer column to interview_questions")
            cursor.execute("ALTER TABLE interview_questions ADD COLUMN user_answer LONGTEXT NULL")
            conn.commit()

        # Ensure score column in interview_questions
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interview_questions'
              AND COLUMN_NAME = 'score'
        """)
        if cursor.fetchone()[0] == 0:
            logger.info("Schema Migration: Adding score column to interview_questions")
            cursor.execute("ALTER TABLE interview_questions ADD COLUMN score FLOAT NULL")
            conn.commit()

        # Ensure feedback column in interview_questions
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'interview_questions'
              AND COLUMN_NAME = 'feedback'
        """)
        if cursor.fetchone()[0] == 0:
            logger.info("Schema Migration: Adding feedback column to interview_questions")
            cursor.execute("ALTER TABLE interview_questions ADD COLUMN feedback TEXT NULL")
            conn.commit()
    except Exception as e:
        logger.error(f"Error checking/migrating DB schema: {e}")
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
