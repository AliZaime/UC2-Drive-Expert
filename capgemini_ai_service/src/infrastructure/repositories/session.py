"""
Session Storage Implementations
Provides in-memory and Redis-backed session stores.
"""
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from src.infrastructure.repositories.base import SessionRepository


from src.domain.negotiation.entities import NegotiationSession, CustomerProfile


class InMemorySessionStore(SessionRepository):
    """
    In-memory session store for development.
    
    Features:
    - Fast access
    - TTL-based expiration
    - Automatic cleanup
    """
    
    def __init__(self, ttl_minutes: int = 60):
        self._sessions: Dict[str, NegotiationSession] = {}
        self._ttl = timedelta(minutes=ttl_minutes)
    
    async def save(self, session: NegotiationSession) -> None:
        """Save or update a session"""
        session.updated_at = datetime.now()
        self._sessions[session.session_id] = session
        # Periodic cleanup
        self._cleanup_expired()
    
    async def get(self, session_id: str) -> Optional[NegotiationSession]:
        """Get a session by ID"""
        session = self._sessions.get(session_id)
        if session and self._is_expired(session):
            await self.delete(session_id)
            return None
        return session
    
    async def delete(self, session_id: str) -> bool:
        """Delete a session"""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False
    
    async def list_active(self, customer_id: Optional[str] = None) -> List[NegotiationSession]:
        """List active sessions"""
        self._cleanup_expired()
        sessions = list(self._sessions.values())
        
        if customer_id:
            sessions = [s for s in sessions if s.customer_id == customer_id]
        
        return [s for s in sessions if not s.is_finalized]
    
    def _is_expired(self, session: NegotiationSession) -> bool:
        return datetime.now() - session.updated_at > self._ttl
    
    def _cleanup_expired(self):
        expired = [
            sid for sid, session in self._sessions.items()
            if self._is_expired(session)
        ]
        for sid in expired:
            del self._sessions[sid]


class RedisSessionStore(SessionRepository):
    """
    Redis-backed session store for production.
    
    Features:
    - Distributed storage
    - Native TTL support
    - Connection pooling
    
    Requires: pip install redis
    """
    
    def __init__(
        self, 
        redis_url: str = "redis://localhost:6379/0",
        ttl_seconds: int = 3600
    ):
        self._redis_url = redis_url
        self._ttl = ttl_seconds
        self._redis = None
        self._prefix = "negotiation_session:"
    
    async def _get_redis(self):
        """Lazy connection initialization"""
        if self._redis is None:
            try:
                import redis.asyncio as redis
                self._redis = redis.from_url(
                    self._redis_url,
                    encoding="utf-8",
                    decode_responses=True
                )
            except ImportError:
                raise RuntimeError(
                    "Redis library not installed. "
                    "Install with: pip install redis"
                )
        return self._redis
    
    async def save(self, session: NegotiationSession) -> None:
        """Save session to Redis with TTL"""
        redis_client = await self._get_redis()
        key = f"{self._prefix}{session.session_id}"
        session.updated_at = datetime.now()
        data = json.dumps(session.to_dict())
        await redis_client.setex(key, self._ttl, data)
        
        # Also index by customer_id for list_active
        if session.customer_id:
            customer_key = f"{self._prefix}customer:{session.customer_id}"
            await redis_client.sadd(customer_key, session.session_id)
            await redis_client.expire(customer_key, self._ttl)
    
    async def get(self, session_id: str) -> Optional[NegotiationSession]:
        """Get session from Redis"""
        redis_client = await self._get_redis()
        key = f"{self._prefix}{session_id}"
        data = await redis_client.get(key)
        
        if data:
            return NegotiationSession.from_dict(json.loads(data))
        return None
    
    async def delete(self, session_id: str) -> bool:
        """Delete session from Redis"""
        redis_client = await self._get_redis()
        key = f"{self._prefix}{session_id}"
        result = await redis_client.delete(key)
        return result > 0
    
    async def list_active(self, customer_id: Optional[str] = None) -> List[NegotiationSession]:
        """List active sessions"""
        redis_client = await self._get_redis()
        sessions = []
        
        if customer_id:
            customer_key = f"{self._prefix}customer:{customer_id}"
            session_ids = await redis_client.smembers(customer_key)
            for sid in session_ids:
                session = await self.get(sid)
                if session and not session.is_finalized:
                    sessions.append(session)
        else:
            # Scan for all sessions (use carefully in production)
            async for key in redis_client.scan_iter(f"{self._prefix}*"):
                if not key.startswith(f"{self._prefix}customer:"):
                    data = await redis_client.get(key)
                    if data:
                        session = NegotiationSession.from_dict(json.loads(data))
                        if not session.is_finalized:
                            sessions.append(session)
        
        return sessions


# Singleton instance
_store_instance: Optional[SessionRepository] = None


def get_session_store(use_redis: bool = False, redis_url: str = None) -> SessionRepository:
    """
    Factory function for session store.
    
    Args:
        use_redis: If True, use Redis store (requires Redis running)
        redis_url: Redis connection URL
    
    Returns:
        Configured session store instance
    """
    global _store_instance
    
    if _store_instance is None:
        if use_redis:
            import os
            url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
            _store_instance = RedisSessionStore(redis_url=url)
        else:
            _store_instance = InMemorySessionStore()
    
    return _store_instance
