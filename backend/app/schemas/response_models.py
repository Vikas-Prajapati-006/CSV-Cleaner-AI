from pydantic import BaseModel
from typing import List, Dict, Any


class CleanResponse(BaseModel):
    """Schema for successful CSV cleaning response payload."""
    file_id: str
    rows_before: int
    rows_after: int
    columns_before: int
    columns_after: int
    preview: List[Dict[str, Any]]
    generated_code: str
    download_url: str


class HealthResponse(BaseModel):
    """Schema for service health check response."""
    status: str
    environment: str