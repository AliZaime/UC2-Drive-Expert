"""
Unified Session Store Proxy
Redirects to the source of truth in infrastructure for DDD compatibility
"""
from src.infrastructure.repositories.session import get_session_store
from src.domain.negotiation.entities import NegotiationSession, CustomerProfile
