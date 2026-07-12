from datetime import datetime
from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: str
    filename: str
    file_type: str
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentChatRequest(BaseModel):
    document_ids: list[str]
    question: str
    provider: str = "openai"
    model: str | None = None
    chat_id: str | None = None


class SourceCitation(BaseModel):
    document_id: str
    filename: str
    chunk_text: str
    score: float


class DocumentChatResponse(BaseModel):
    answer: str
    sources: list[SourceCitation]
    chat_id: str
