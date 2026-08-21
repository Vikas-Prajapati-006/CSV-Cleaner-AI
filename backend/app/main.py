from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.clean import router as clean_router
from app.api.v1.health import router as health_router
from app.utils.logger import logger

app = FastAPI(
    title="CSV Cleaner AI API",
    version="1.0.0",
    description="High-Speed Secure AI-Powered CSV Data Cleaning Service"
)

# Configure Cross-Origin Resource Sharing (CORS)
# allow_origins me "*" add karne se Cloudflare aur localhost dono seamlessly work karenge
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(health_router, prefix="/api/v1", tags=["Health"])
app.include_router(clean_router, prefix="/api/v1", tags=["CSV Cleaner"])


@app.on_event("startup")
def startup_event():
    """Triggered on application startup to verify configuration and state."""
    logger.info("CSV Cleaner AI Microservice initiated successfully.")