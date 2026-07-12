from datetime import datetime
from pydantic import BaseModel


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatOut(BaseModel):
    id: str
    title: str
    module: str
    provider: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatDetailOut(ChatOut):
    messages: list[MessageOut] = []


class ChatCreate(BaseModel):
    title: str | None = "New Chat"
    module: str = "general"
    provider: str = "openai"


class ChatRename(BaseModel):
    title: str


class ChatSendRequest(BaseModel):
    chat_id: str | None = None  # None => create a new chat
    message: str
    provider: str = "openai"
    model: str | None = None
    stream: bool = True
