from crewai import LLM
from backend.core.config import settings

def get_openai_llm(model: str = "gpt-4o-mini") -> LLM:
    return LLM(model=model, api_key=settings.OPENAI_API_KEY)
