from crewai import LLM
from backend.core.config import settings

def get_ollama_llm(model: str = "ollama/qwen2.5:1.5b") -> LLM:
    return LLM(
        model=model,
        base_url=settings.OLLAMA_BASE_URL
    )
