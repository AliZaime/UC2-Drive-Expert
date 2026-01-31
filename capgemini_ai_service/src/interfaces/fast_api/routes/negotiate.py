"""
Negotiate Routes
API endpoints for negotiation functionality.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from src.interfaces.fast_api.dependencies import (
    get_negotiation_service,
    verify_api_key,
)
from src.domain.negotiation.service import NegotiationService

router = APIRouter(prefix="/ai", tags=["Negotiation"])


# ============ Request/Response Models ============

class NegotiateRequest(BaseModel):
    """Request model for negotiation endpoint"""
    session_id: str
    customer_message: str
    customer_id: Optional[str] = None
    current_offer: Optional[Dict[str, Any]] = None
    vehicle_context: Optional[Dict[str, Any]] = None
    trade_in_context: Optional[Dict[str, Any]] = None
    profile_context: Optional[Dict[str, Any]] = None


class EmotionalContext(BaseModel):
    primary_emotion: str
    intensity: float
    sentiment_score: float
    key_concerns: List[str]
    recommended_tone: str
    recommended_strategy: str


class AgentStep(BaseModel):
    agent_name: str
    action: str
    reasoning: str
    data: Dict[str, Any]
    confidence: float


class NegotiateResponse(BaseModel):
    """Response model for negotiation endpoint"""
    session_id: str
    agent_message: str
    detected_language: str
    emotional_analysis: Optional[EmotionalContext] = None
    intent_detected: str
    new_offer: Optional[Dict[str, Any]] = None
    alternatives: List[Dict[str, Any]] = []
    reasoning: str
    confidence: float
    agent_steps: List[AgentStep] = []
    should_finalize: bool = False
    emotional_trend: Optional[str] = None
    win_win_score: Optional[float] = None
    negotiation_round: int = 1


# ============ Routes ============

@router.post("/negotiate", response_model=NegotiateResponse)
async def negotiate(
    request: NegotiateRequest,
    api_key: str = Depends(verify_api_key),
    negotiation_svc: NegotiationService = Depends(get_negotiation_service),
):
    """
    Process a negotiation turn.
    
    This endpoint:
    1. Analyzes customer emotion and intent
    2. Determines conversation phase
    3. Calculates appropriate concession (if negotiating)
    4. Generates contextual, multi-language response
    
    Returns structured response with:
    - Agent message (in customer's language)
    - Emotional analysis
    - Updated offer (if applicable)
    - Reasoning for transparency
    """
    try:
        # Use the existing agent for now (adapter pattern)
        from schemas.models import NegotiationRequestModel
        
        legacy_request = NegotiationRequestModel(
            session_id=request.session_id,
            customer_message=request.customer_message,
            customer_id=request.customer_id,
            current_offer=request.current_offer,
            vehicle_context=request.vehicle_context,
            trade_in_context=request.trade_in_context,
            profile_context=request.profile_context,
        )
        
        result = await negotiation_svc.negotiate(legacy_request)
        
        # Convert response if needed
        if hasattr(result, 'dict'):
            result = result.dict()
        
        return NegotiateResponse(
            session_id=request.session_id,
            agent_message=result.get("agent_message", ""),
            detected_language=result.get("detected_language", "fr"),
            emotional_analysis=EmotionalContext(**result["emotional_analysis"]) 
                if result.get("emotional_analysis") else None,
            intent_detected=str(result.get("intent_detected", "request_info")),
            new_offer=result.get("new_offer"),
            alternatives=result.get("alternatives", []),
            reasoning=result.get("reasoning", ""),
            confidence=result.get("confidence", 0.8),
            agent_steps=[AgentStep(**s) if isinstance(s, dict) else s 
                        for s in result.get("agent_steps", [])],
            should_finalize=result.get("should_finalize", False),
            emotional_trend=result.get("emotional_trend"),
            win_win_score=result.get("win_win_score"),
            negotiation_round=result.get("negotiation_round", 1),
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Negotiation failed: {str(e)}"
        )


@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    api_key: str = Depends(verify_api_key),
):
    """
    Get current negotiation session details.
    
    Returns session state including:
    - Conversation history
    - Current offer
    - Customer profile
    - Emotional trend
    """
    from src.infrastructure.repositories.session import get_session_store
    
    store = get_session_store()
    session = await store.get(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session.session_id,
        "customer_id": session.customer_id,
        "conversation_history": session.conversation_history,
        "current_offer": session.current_offer,
        "negotiation_round": session.negotiation_round,
        "current_phase": session.current_phase,
        "win_win_score": session.win_win_score,
        "is_finalized": session.is_finalized,
        "outcome": session.outcome,
    }
