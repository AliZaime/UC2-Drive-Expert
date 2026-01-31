"""
FastAPI Main Application for AI Negotiation Service
Provides endpoints for valuation and negotiation agents
"""
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from datetime import datetime
import uvicorn
import uuid
import os

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config.settings import settings
from schemas.models import (
    ValuationRequestModel,
    ValuationResponseModel,
    NegotiationRequestModel,
    NegotiationResponseModel,
    HealthResponse,
    OrchestratorRequestModel,
    OrchestratorResponseModel,
    DealStructuringRequestModel
)
from agents import valuation_agent, negotiation_agent, profiling_agent, inventory_agent, deal_agent, orchestrator_agent
from core.logger import logger

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)

# API Key security (optional - check environment variable)
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def verify_api_key(api_key: str = Depends(api_key_header)):
    """Verify API key if AI_SERVICE_API_KEY is set in environment"""
    expected_key = os.getenv("AI_SERVICE_API_KEY")
    if expected_key and api_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return api_key

# Initialize FastAPI app
app = FastAPI(
    title="AI Negotiation Service",
    description="Multi-agent AI system for autonomous vehicle negotiation",
    version="1.0.0"
)

# Add rate limiter to app state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint"""
    return HealthResponse(
        status="online",
        service=settings.service_name,
        timestamp=datetime.now(),
        groq_connected=True
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    groq_connected = False
    try:
        # Test Groq connection only if API key is configured
        from config.settings import settings
        if settings.groq_api_key:
            from agents import get_llm
            llm = get_llm()
            groq_connected = True
    except Exception as e:
        logger.warning("groq_connection_failed", error=str(e))
        groq_connected = False
    logger.info("health_check_ping", groq_connected=groq_connected)
    return {"status": "active", "service": "ai-negotiation-service", "groq_connected": groq_connected}

@app.post("/ai/negotiate", response_model=NegotiationResponseModel)
@limiter.limit("30/minute")  # 30 negotiation turns per minute per IP
async def negotiate(request: Request, neg_request: NegotiationRequestModel, api_key: str = Depends(verify_api_key)):
    """
    Direct endpoint for the Negotiation Agent
    """
    try:
        logger.info("negotiation_turn_start", session_id=neg_request.session_id)
        response = await negotiation_agent.negotiate(neg_request)
        logger.info("negotiation_turn_end", session_id=neg_request.session_id)
        return response
    except Exception as e:
        logger.error("negotiation_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/orchestrate")
@limiter.limit("10/minute")  # 10 full orchestrations per minute per IP
async def orchestrate_flow(request: Request, orch_request: OrchestratorRequestModel, api_key: str = Depends(verify_api_key)):
    """
    Main entry point for the Multi-Agent Flow
    """
    try:
        session_id = str(uuid.uuid4())
        logger.info("orchestrator_start", customer_id=orch_request.customer_id, session_id=session_id)
        
        # Prepare trade-in data if provided
        trade_in_data = {}
        if orch_request.trade_in_data:
            trade_in_data = orch_request.trade_in_data.model_dump()
        
        inputs = {
            "session_id": session_id,
            "customer_id": orch_request.customer_id,
            "trade_in_id": orch_request.trade_in_id,
            "preferences": orch_request.preferences.model_dump() if orch_request.preferences else {},
            "trade_in_data": trade_in_data
        }
        
        result = await orchestrator_agent.run_flow(inputs)
        logger.info("orchestrator_complete", session_id=session_id, 
                   win_win_score=result.get("win_win_score", 0))
        return result
    except Exception as e:
        logger.error("orchestrator_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/profile")
@limiter.limit("20/minute")
async def analyze_profile(request: Request, profile_request: OrchestratorRequestModel, api_key: str = Depends(verify_api_key)):
    """
    Analyze customer profile based on preferences and history
    """
    try:
        # TODO: Accept conversation_history in request model for richer profiling
        history = [] 
        
        logger.info("profile_analysis_start", customer_id=profile_request.customer_id)
        result = await profiling_agent.analyze_profile(
            conversation_history=history,
            stated_preferences=profile_request.preferences.model_dump() if profile_request.preferences else {}
        )
        return result
    except Exception as e:
        logger.error("profile_analysis_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/match")
@limiter.limit("20/minute")
async def match_inventory(request: Request, match_request: OrchestratorRequestModel, api_key: str = Depends(verify_api_key)):
    """
    Match inventory to customer profile
    """
    try:
        profile = match_request.preferences.model_dump() if match_request.preferences else {}
        logger.info("inventory_match_start", segment=profile.get("segment"))

        result = await inventory_agent.find_matches(
            profile=profile,
            inventory=None 
        )
        return result
    except Exception as e:
        logger.error("inventory_match_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/structuring")
@limiter.limit("20/minute")
async def structure_deal(request: Request, deal_request: DealStructuringRequestModel, api_key: str = Depends(verify_api_key)):
    """
    Structure financial deal options based on vehicle price and trade-in value
    """
    try:
        logger.info("deal_structuring_start", vehicle_price=deal_request.vehicle_price)
        
        profile = {
            "segment": "Inferred", 
            "priorities": deal_request.preferences.priorities,
            "price_sensitivity": "Medium",
            "monthly_budget": deal_request.preferences.monthly_budget
        }
        
        result = await deal_agent.structure_deal(
            vehicle_price=deal_request.vehicle_price,
            trade_in_value=deal_request.trade_in_value,
            profile=profile
        )
        logger.info("deal_structuring_complete")
        return result
    except Exception as e:
        logger.error("deal_structuring_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ai/session/{session_id}")
async def get_session(session_id: str, api_key: str = Depends(verify_api_key)):
    """
    Retrieve full session state for a negotiation session.
    Useful for resuming negotiations or displaying session history.
    """
    try:
        from core.session_store import get_session_store
        store = get_session_store()
        session = await store.get(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "session_id": session.session_id,
            "customer_id": session.customer_id,
            "status": session.status,
            "negotiation_round": session.negotiation_round,
            "current_offer": {
                "monthly": session.current_monthly,
                "duration": session.current_duration,
                "down_payment": session.current_down_payment
            },
            "vehicle_context": {
                "vehicle_id": session.target_vehicle_id,
                "price": session.target_vehicle_price,
                "cost": session.vehicle_cost
            },
            "trade_in_context": {
                "trade_in_id": session.trade_in_id,
                "value": session.trade_in_value
            },
            "customer_profile": session.customer_profile.to_dict(),
            "emotional_trend": session.emotional_trend.get_trend(),
            "win_win_score": session.win_win_score,
            "offer_history": session.offer_history,
            "conversation_history": session.conversation_history[-10:],  # Last 10 messages
            "summary": session.get_summary()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("session_get_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def get_metrics():
    """Get AI service metrics (basic info)"""
    return {
        "service": settings.service_name,
        "model": settings.default_model,
        "status": "operational",
        "features": [
            "Explainable AI (Transparency)",
            "Emotional Intelligence (Empathy)",
            "Win-Win Optimization",
            "Moroccan Market Specialization"
        ]
    }

@app.get("/metrics/prometheus")
async def prometheus_metrics():
    """Prometheus-compatible metrics endpoint"""
    try:
        from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Counter, Histogram, Gauge
        from prometheus_client import CollectorRegistry, multiprocess
        from starlette.responses import Response
        
        # Create custom registry for this service
        registry = CollectorRegistry()
        
        # Return metrics in Prometheus format
        return Response(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST
        )
    except ImportError:
        return {"error": "prometheus_client not installed"}

@app.post("/ai/valuation", response_model=ValuationResponseModel)
async def valuate_vehicle(request: ValuationRequestModel, api_key: str = Depends(verify_api_key)):
    """
    Direct endpoint for Vehicle Valuation
    """
    try:
        logger.info("valuation_start", vehicle=request.vehicle.model_dump())
        response = await valuation_agent.valuate(request)
        logger.info("valuation_complete", value=response.estimated_value)
        return response
    except Exception as e:
        logger.error("valuation_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
