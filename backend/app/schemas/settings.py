from datetime import datetime
from pydantic import BaseModel


class APIKeyCreate(BaseModel):
    provider: str  # openai | gemini | claude | deepseek
    api_key: str


class APIKeyOut(BaseModel):
    id: str
    provider: str
    is_active: bool
    masked_key: str
    updated_at: datetime

    class Config:
        from_attributes = True


class APIKeyTestRequest(BaseModel):
    provider: str
    api_key: str


class APIKeyTestResponse(BaseModel):
    success: bool
    message: str
