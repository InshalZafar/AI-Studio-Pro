from collections.abc import AsyncGenerator
from typing import Any
from openai import AsyncOpenAI, AuthenticationError
from app.ai.base import AIProvider

DEEPSEEK_BASE_URL = "https://api.deepseek.com"


class DeepSeekProvider(AIProvider):
    """DeepSeek exposes an OpenAI-compatible API, so we reuse the openai SDK with a custom base_url."""

    def default_model(self) -> str:
        return "deepseek-chat"

    def _client(self) -> AsyncOpenAI:
        return AsyncOpenAI(api_key=self.api_key, base_url=DEEPSEEK_BASE_URL)

    async def chat(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        client = self._client()
        resp = await client.chat.completions.create(
            model=self.model,
            messages=messages,
            **kwargs,
        )
        return resp.choices[0].message.content or ""

    async def chat_stream(self, messages: list[dict[str, str]], **kwargs: Any) -> AsyncGenerator[str, None]:
        client = self._client()
        stream = await client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=True,
            **kwargs,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield delta

    async def test_connection(self) -> tuple[bool, str]:
        try:
            client = self._client()
            await client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
            )
            return True, "DeepSeek connection successful."
        except AuthenticationError:
            return False, "Invalid DeepSeek API key."
        except Exception as e:  # noqa: BLE001
            return False, f"DeepSeek connection failed: {e}"
