from collections.abc import AsyncGenerator
from typing import Any
import google.generativeai as genai
from app.ai.base import AIProvider


def _to_gemini_history(messages: list[dict[str, str]]) -> tuple[str | None, list[dict[str, Any]]]:
    system = None
    history = []
    for m in messages:
        if m["role"] == "system":
            system = (system + "\n" + m["content"]) if system else m["content"]
        else:
            role = "model" if m["role"] == "assistant" else "user"
            history.append({"role": role, "parts": [m["content"]]})
    return system, history


class GeminiProvider(AIProvider):
    def default_model(self) -> str:
        return "gemini-2.0-flash"

    def _model(self, system: str | None = None):
        genai.configure(api_key=self.api_key)
        return genai.GenerativeModel(self.model, system_instruction=system)

    async def chat(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        system, history = _to_gemini_history(messages)
        model = self._model(system)
        # Last message is the new prompt; rest is history
        last = history[-1]["parts"][0] if history else ""
        convo_history = history[:-1]
        chat = model.start_chat(history=convo_history)
        resp = await chat.send_message_async(last)
        return resp.text or ""

    async def chat_stream(self, messages: list[dict[str, str]], **kwargs: Any) -> AsyncGenerator[str, None]:
        system, history = _to_gemini_history(messages)
        model = self._model(system)
        last = history[-1]["parts"][0] if history else ""
        convo_history = history[:-1]
        chat = model.start_chat(history=convo_history)
        resp = await chat.send_message_async(last, stream=True)
        async for chunk in resp:
            if chunk.text:
                yield chunk.text

    async def test_connection(self) -> tuple[bool, str]:
        try:
            model = self._model()
            resp = model.generate_content("ping")
            if resp.text is not None:
                return True, "Gemini connection successful."
            return False, "Gemini responded but with no content."
        except Exception as e:  # noqa: BLE001
            return False, f"Gemini connection failed: {e}"
