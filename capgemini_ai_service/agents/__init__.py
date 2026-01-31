from langchain_groq import ChatGroq
from config.settings import settings

def get_llm():
    """Get configured Groq LLM instance"""
    return ChatGroq(
        groq_api_key=settings.groq_api_key,
        model_name=settings.default_model,
        temperature=settings.temperature,
        max_tokens=settings.max_tokens
    )

# Import agents
from agents.valuation_agent import valuation_agent
from agents.negotiation.agent import negotiation_agent

from agents.profiling.agent import profiling_agent
from agents.inventory_agent import inventory_agent
from agents.deal_agent import deal_agent
from agents.orchestrator_agent import orchestrator_agent

__all__ = ["get_llm", "valuation_agent", "negotiation_agent", "profiling_agent", "inventory_agent", "deal_agent", "orchestrator_agent"]
