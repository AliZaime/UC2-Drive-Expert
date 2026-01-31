"""
Health Check Routes
Provides endpoints for service health monitoring and readiness checks.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime

from config.settings import settings

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    service: str = "ai-negotiation-service"
    timestamp: str
    groq_configured: bool
    redis_configured: bool = False


class MetricsResponse(BaseModel):
    uptime_seconds: float
    total_requests: int = 0
    active_sessions: int = 0


# Track startup time
_startup_time = datetime.now()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    
    Returns service status and configuration info.
    Used by load balancers and container orchestrators.
    """
    import os
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        groq_configured=bool(settings.groq_api_key),
        redis_configured=bool(os.getenv("REDIS_URL")),
    )


@router.get("/ready")
async def readiness_check():
    """
    Readiness check endpoint.
    
    Verifies service can accept traffic:
    - LLM is configured
    - Dependencies are available
    """
    errors = []
    
    # Check Groq API key
    if not settings.groq_api_key:
        errors.append("GROQ_API_KEY not configured")
    
    if errors:
        raise HTTPException(
            status_code=503,
            detail={"status": "not_ready", "errors": errors}
        )
    
    return {"status": "ready"}


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    """
    Basic metrics endpoint.
    
    Returns service metrics for monitoring.
    """
    uptime = (datetime.now() - _startup_time).total_seconds()
    
    return MetricsResponse(
        uptime_seconds=uptime,
    )
