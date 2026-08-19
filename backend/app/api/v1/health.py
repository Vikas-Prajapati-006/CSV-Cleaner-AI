from fastapi import APIRouter
from app.schemas.response_models import HealthResponse
from app.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Returns the operational status and active runtime environment of the service.
    """
    return HealthResponse(
        status="healthy",
        environment=settings.ENVIRONMENT
    )