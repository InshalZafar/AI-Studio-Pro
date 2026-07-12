from pydantic import BaseModel


class SportsChatRequest(BaseModel):
    sport: str  # cricket | football | basketball | tennis | f1 | olympics
    question: str
    provider: str = "openai"
    model: str | None = None
    chat_id: str | None = None


class SportsChatResponse(BaseModel):
    answer: str
    chat_id: str
