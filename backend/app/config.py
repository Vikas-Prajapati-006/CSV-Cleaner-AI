from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:4321,http://localhost:3000"
    STORAGE_DIR: str = "storage"
    MAX_FILE_SIZE_MB: int = 25

    @property
    def cors_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()