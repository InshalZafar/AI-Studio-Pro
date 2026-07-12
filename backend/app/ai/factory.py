"""
Factory that returns the correct AIProvider instance based on a provider name string.
This is the single place the rest of the app needs to touch to add a new provider.
"""
from app.ai.base import AIProvider
from app.ai.openai_provider import OpenAIProvider
from app.ai.claude_provider import ClaudeProvider
from app.ai.gemini_provider import GeminiProvider
from app.ai.deepseek_provider import DeepSeekProvider

_PROVIDERS = {
    "openai": OpenAIProvider,
    "claude": ClaudeProvider,
    "gemini": GeminiProvider,
    "deepseek": DeepSeekProvider,
}

SUPPORTED_PROVIDERS = list(_PROVIDERS.keys())


def get_provider(provider_name: str, api_key: str, model: str | None = None) -> AIProvider:
    provider_name = provider_name.lower().strip()
    if provider_name not in _PROVIDERS:
        raise ValueError(
            f"Unsupported provider '{provider_name}'. Supported: {', '.join(SUPPORTED_PROVIDERS)}"
        )
    provider_cls = _PROVIDERS[provider_name]
    return provider_cls(api_key=api_key, model=model)
