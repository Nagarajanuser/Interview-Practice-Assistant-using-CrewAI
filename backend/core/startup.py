from backend.core.database import ensure_db_schema
from backend.core.logger import logger

def on_startup():
    logger.info("Initializing Application Startup Tasks...")
    ensure_db_schema()
    logger.info("Application Startup Tasks Complete.")
