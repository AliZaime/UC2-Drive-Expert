"""
Orchestrate Routes
API endpoints for the multi-agent orchestration workflow.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from src.interfaces.fast_api.dependencies import (
    get_orchestration_flow,
    verify_api_key,
)
from src.domain.orchestration.flow import OrchestrationFlow

router = APIRouter(prefix="/ai", tags=["Orchestration"])


# ============ Request/Response Models ============

class OrchestrateRequest(BaseModel):
    """Request for full orchestration flow"""
    session_id: str
    customer_message: str
    customer_id: Optional[str] = None
    trade_in_data: Optional[Dict[str, Any]] = None
    customer_preferences: Optional[Dict[str, Any]] = None


class AgentResult(BaseModel):
    """Result from a single agent step"""
    agent: str
    success: bool
    data: Dict[str, Any]
    reasoning: Optional[str] = None


class OrchestrateResponse(BaseModel):
    """Response from orchestration flow"""
    session_id: str
    status: str
    agent_results: List[AgentResult]
    final_response: str
    next_action: str
    workflow_complete: bool = False


class ProfileRequest(BaseModel):
    conversation_history: List[Dict[str, str]]
    stated_preferences: Optional[Dict[str, Any]] = None


class ProfileResponse(BaseModel):
    segment: str
    price_sensitivity: str
    priorities: List[str]
    communication_style: str
    monthly_budget: Optional[float] = None
    confidence_score: float


class InventoryMatchRequest(BaseModel):
    customer_profile: Dict[str, Any]
    max_results: int = 5


class DealStructureRequest(BaseModel):
    vehicle_price: float
    trade_in_value: float = 0
    down_payment: float = 0
    customer_budget: Optional[float] = None


# ============ Routes ============

@router.post("/orchestrate", response_model=OrchestrateResponse)
async def orchestrate_flow(
    request: OrchestrateRequest,
    api_key: str = Depends(verify_api_key),
    flow: OrchestrationFlow = Depends(get_orchestration_flow),
):
    """
    Run the full multi-agent orchestration workflow.
    
    Coordinates:
    1. Customer profiling
    2. Trade-in valuation (if applicable)
    3. Inventory matching
    4. Deal structuring
    5. Negotiation response
    
    Returns consolidated results from all agents.
    """
    try:
        result = await flow.run_flow({
            "session_id": request.session_id,
            "customer_message": request.customer_message,
            "customer_id": request.customer_id,
            "trade_in_data": request.trade_in_data,
            "customer_preferences": request.customer_preferences,
        })
        
        if hasattr(result, 'dict'):
            result = result.dict()
        
        # Map agent results
        agent_results = []
        for agent_name in ["profiling", "valuation", "inventory", "deal", "negotiation"]:
            if agent_name in result:
                agent_results.append(AgentResult(
                    agent=agent_name,
                    success=True,
                    data=result[agent_name],
                ))
        
        return OrchestrateResponse(
            session_id=request.session_id,
            status=result.get("status", "completed"),
            agent_results=agent_results,
            final_response=result.get("agent_message", result.get("final_response", "")),
            next_action=result.get("next_action", "await_customer"),
            workflow_complete=result.get("should_finalize", False),
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Orchestration failed: {str(e)}"
        )


@router.post("/profile", response_model=ProfileResponse)
async def profile_customer(
    request: ProfileRequest,
    api_key: str = Depends(verify_api_key),
    flow: OrchestrationFlow = Depends(get_orchestration_flow),
):
    """
    Analyze conversation to build customer profile.
    
    Returns psychographic profile including:
    - Segment (e.g., "Family-Focused Value Seeker")
    - Price sensitivity
    - Priorities
    - Communication style
    """
    try:
        result = await flow.run_profiling(
            request.conversation_history,
            request.stated_preferences or {}
        )
        
        if hasattr(result, 'dict'):
            result = result.dict()
        
        return ProfileResponse(
            segment=result.get("segment", "Unknown"),
            price_sensitivity=result.get("price_sensitivity", "Medium"),
            priorities=result.get("priorities", []),
            communication_style=result.get("communication_style", "Professional"),
            monthly_budget=result.get("monthly_budget"),
            confidence_score=result.get("confidence_score", 0.7),
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Profiling failed: {str(e)}"
        )


@router.post("/match")
async def match_inventory(
    request: InventoryMatchRequest,
    api_key: str = Depends(verify_api_key),
    flow: OrchestrationFlow = Depends(get_orchestration_flow),
):
    """
    Find vehicles matching customer profile.
    
    Ranks vehicles by match score based on:
    - Budget fit
    - Feature preferences
    - Use case (family, sport, etc.)
    """
    try:
        result = await flow.run_inventory_matching(request.customer_profile)
        
        if hasattr(result, 'dict'):
            result = result.dict()
        
        matches = result.get("matches", [])[:request.max_results]
        
        return {
            "matches": matches,
            "total_available": result.get("total_available", len(matches)),
            "search_criteria": request.customer_profile,
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inventory matching failed: {str(e)}"
        )


@router.post("/structure_deal")
async def structure_deal(
    request: DealStructureRequest,
    api_key: str = Depends(verify_api_key),
    flow: OrchestrationFlow = Depends(get_orchestration_flow),
):
    """
    Generate financing options for a deal.
    
    Creates multiple deal structures with:
    - Different durations (36, 48, 60, 72 months)
    - Monthly payment calculations
    - Total cost comparisons
    """
    try:
        result = await flow.run_deal_structuring(
            vehicle_price=request.vehicle_price,
            trade_in_value=request.trade_in_value,
            customer_budget=request.customer_budget or 5000,
        )
        
        if hasattr(result, 'dict'):
            result = result.dict()
        
        return {
            "options": result.get("options", []),
            "recommended": result.get("recommended"),
            "vehicle_price": request.vehicle_price,
            "trade_in_value": request.trade_in_value,
            "amount_financed": request.vehicle_price - request.trade_in_value - request.down_payment,
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Deal structuring failed: {str(e)}"
        )
