from fastapi import APIRouter
from backend.api.v1.routes.health import router as health_router
from backend.api.v1.routes.interview import router as interview_router
from backend.api.v1.routes.evaluation import router as evaluation_router
from backend.api.v1.routes.session import router as session_router
from backend.api.v1.routes.admin import router as admin_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(interview_router)
api_router.include_router(evaluation_router)
api_router.include_router(session_router)
api_router.include_router(admin_router)

__all__ = ["api_router"]
