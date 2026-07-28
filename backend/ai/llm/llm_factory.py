from crewai import LLM
from backend.core.config import settings
from backend.ai.llm.openai import get_openai_llm
from backend.ai.llm.ollama import get_ollama_llm

def get_crewai_llm() -> LLM:
    if settings.OPENAI_API_KEY:
        return get_openai_llm()
    else:
        return get_ollama_llm()
