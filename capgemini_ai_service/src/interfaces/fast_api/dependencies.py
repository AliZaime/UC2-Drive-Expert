"""
FastAPI Dependency Injection Container
Provides configured instances of services for route handlers.

Usage in routes:
    @router.post("/negotiate")
    async def negotiate(
        request: NegotiationRequest,
        negotiation_svc: NegotiationService = Depends(get_negotiation_service)
    ):
        return await negotiation_svc.negotiate(request)
"""
from functools import lru_cache
from typing import Generator

from fastapi import Depends

from config.settings import settings
from src.infrastructure.llm.base import BaseLLM
from src.infrastructure.llm.groq_adapter import GroqAdapter
from src.infrastructure.repositories.base import InventoryRepository, SessionRepository
from src.infrastructure.repositories.inventory import get_inventory_repository
from src.infrastructure.repositories.session import (
    InMemorySessionStore,
    RedisSessionStore,
    get_session_store,
)
from src.domain.negotiation.service import NegotiationService
from src.domain.valuation.service import ValuationService
from src.domain.orchestration.flow import OrchestrationFlow


# ============ Infrastructure Dependencies ============

@lru_cache()
def get_llm() -> BaseLLM:
    """
    Get configured LLM instance.
    
    Uses settings to determine which provider to use.
    Cached for efficiency.
    """
    return GroqAdapter(
        api_key=settings.groq_api_key,
        model_name=settings.default_model,
        temperature=settings.temperature,
        max_tokens=settings.max_tokens,
    )


def get_inventory_repo() -> InventoryRepository:
    """Get inventory repository instance"""
    return get_inventory_repository()


def get_session_repo() -> SessionRepository:
    """
    Get session repository instance.
    
    Uses Redis in production if REDIS_URL is set,
    otherwise falls back to in-memory store.
    """
    import os
    use_redis = bool(os.getenv("REDIS_URL"))
    return get_session_store(use_redis=use_redis)


# ============ Domain Service Dependencies ============

def get_negotiation_service(
    llm: BaseLLM = Depends(get_llm),
    session_store: SessionRepository = Depends(get_session_repo),
) -> NegotiationService:
    """
    Get configured NegotiationService instance.
    
    Injects LLM and session store dependencies.
    """
    return NegotiationService(llm=llm, session_store=session_store)


def get_valuation_service(
    llm: BaseLLM = Depends(get_llm),
) -> ValuationService:
    """Get configured ValuationService instance"""
    return ValuationService(llm=llm)


def get_orchestration_flow(
    negotiation_svc: NegotiationService = Depends(get_negotiation_service),
    valuation_svc: ValuationService = Depends(get_valuation_service),
) -> OrchestrationFlow:
    """
    Get configured OrchestrationFlow instance.
    
    Injects all sub-services for orchestration.
    """
    return OrchestrationFlow(
        negotiation_service=negotiation_svc,
        valuation_service=valuation_svc,
    )


# ============ Security Dependencies ============

from fastapi import HTTPException, Header


async def verify_api_key(
    x_api_key: str = Header(None, alias="X-API-Key")
) -> str:
    """
    Verify API key from header.
    
    If AI_SERVICE_API_KEY env var is set, requires matching key.
    Otherwise, allows all requests (development mode).
    """
    import os
    required_key = os.getenv("AI_SERVICE_API_KEY")
    
    if required_key:
        if not x_api_key or x_api_key != required_key:
            raise HTTPException(status_code=401, detail="Invalid API Key")
    
    return x_api_key or "development"
