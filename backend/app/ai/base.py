"""
Abstract interface all AI providers implement, so the rest of the app
never needs to know which provider (OpenAI/Claude/Gemini/DeepSeek) is active.
"""
from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import Any


class AIProvider(ABC):
    """Common interface for chat-completion style AI providers."""

    def __init__(self, api_key: str, model: str | None = None):
        self.api_key = api_key
        self.model = model or self.default_model()

    @abstractmethod
    def default_model(self) -> str:
        ...

    @abstractmethod
    async def chat(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        """Non-streaming chat completion. messages = [{"role": "user"/"assistant"/"system", "content": str}]"""
        ...

    @abstractmethod
    async def chat_stream(self, messages: list[dict[str, str]], **kwargs: Any) -> AsyncGenerator[str, None]:
        """Streaming chat completion, yields text chunks."""
        ...

    @abstractmethod
    async def test_connection(self) -> tuple[bool, str]:
        """Returns (success, message) — used by the API Key Manager's 'Test connection' button."""
        ...
