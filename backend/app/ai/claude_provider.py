from collections.abc import AsyncGenerator
from typing import Any
from anthropic import AsyncAnthropic, AuthenticationError
from app.ai.base import AIProvider


def _split_system(messages: list[dict[str, str]]) -> tuple[str | None, list[dict[str, str]]]:
    """Claude's API takes 'system' separately from the messages list."""
    system = None
    convo = []
    for m in messages:
        if m["role"] == "system":
            system = (system + "\n" + m["content"]) if system else m["content"]
        else:
            convo.append(m)
    return system, convo


class ClaudeProvider(AIProvider):
    def default_model(self) -> str:
        return "claude-sonnet-4-6"

    def _client(self) -> AsyncAnthropic:
        return AsyncAnthropic(api_key=self.api_key)

    async def chat(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        client = self._client()
        system, convo = _split_system(messages)
        resp = await client.messages.create(
            model=self.model,
            system=system,
            messages=convo,
            max_tokens=kwargs.pop("max_tokens", 2048),
            **kwargs,
        )
        return "".join(block.text for block in resp.content if block.type == "text")

    async def chat_stream(self, messages: list[dict[str, str]], **kwargs: Any) -> AsyncGenerator[str, None]:
        client = self._client()
        system, convo = _split_system(messages)
        async with client.messages.stream(
            model=self.model,
            system=system,
            messages=convo,
            max_tokens=kwargs.pop("max_tokens", 2048),
            **kwargs,
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def test_connection(self) -> tuple[bool, str]:
        try:
            client = self._client()
            await client.messages.create(
                model=self.model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
            )
            return True, "Claude connection successful."
        except AuthenticationError:
            return False, "Invalid Anthropic API key."
        except Exception as e:  # noqa: BLE001
            return False, f"Claude connection failed: {e}"
