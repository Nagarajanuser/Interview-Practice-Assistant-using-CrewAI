from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from backend.shared.exceptions.custom_exceptions import InterviewSessionNotFoundException, InterviewGenerationException

def register_exception_handlers(app: FastAPI):
    @app.exception_handler(InterviewSessionNotFoundException)
    async def session_not_found_handler(request: Request, exc: InterviewSessionNotFoundException):
        return JSONResponse(
            status_code=404,
            content={"status": "FAILED", "message": str(exc), "interview_session_id": exc.session_id}
        )

    @app.exception_handler(InterviewGenerationException)
    async def generation_exception_handler(request: Request, exc: InterviewGenerationException):
        return JSONResponse(
            status_code=500,
            content={"status": "FAILED", "message": str(exc)}
        )
