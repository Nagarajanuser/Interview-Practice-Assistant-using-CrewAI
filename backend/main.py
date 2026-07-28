import os
import sys
from fastapi import FastAPI

# Add backend directory to sys.path to support execution as a standalone script or module
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.core.config import settings
from backend.core.middleware import setup_cors_middleware
from backend.core.startup import on_startup
from backend.shared.exceptions.handlers import register_exception_handlers
from backend.api.v1.routes import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION
)

# Setup CORS Middleware
setup_cors_middleware(app)

# Register Custom Exception Handlers
register_exception_handlers(app)

# Include API Router
app.include_router(api_router)

# Run Startup hooks
@app.on_event("startup")
def startup_event():
    on_startup()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
