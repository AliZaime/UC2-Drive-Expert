"""
Valuate Routes
API endpoints for vehicle trade-in valuation.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from src.interfaces.fast_api.dependencies import (
    get_valuation_service,
    verify_api_key,
)
from src.domain.valuation.service import ValuationService

router = APIRouter(prefix="/ai", tags=["Valuation"])


# ============ Request/Response Models ============

class ValuateRequest(BaseModel):
    """Request for vehicle valuation"""
    make: str
    model: str
    year: int
    mileage: int
    condition: str = "good"
    vin: Optional[str] = None
    extras: Optional[List[str]] = None
    damage_notes: Optional[str] = None


class AdjustmentItem(BaseModel):
    """Single adjustment in valuation breakdown"""
    factor: str
    amount: float
    percentage: float
    reasoning: str


class ValuateResponse(BaseModel):
    """Structured valuation response"""
    base_value: float
    final_value: float
    adjustments: List[AdjustmentItem]
    confidence: float
    explanation: str
    market_data: Optional[Dict[str, Any]] = None


# ============ Routes ============

@router.post("/valuation", response_model=ValuateResponse)
async def valuate_vehicle(
    request: ValuateRequest,
    api_key: str = Depends(verify_api_key),
    valuation_svc: ValuationService = Depends(get_valuation_service),
):
    """
    Get trade-in valuation for a vehicle.
    
    Provides:
    - Base market value
    - Adjustments for mileage, condition, etc.
    - Final estimated value
    - Confidence score
    - Detailed explanation (explainable AI)
    """
    try:
        # Use legacy agent for now
        from schemas.models import ValuationRequestModel
        
        legacy_request = ValuationRequestModel(
            make=request.make,
            model=request.model,
            year=request.year,
            mileage=request.mileage,
            condition=request.condition,
            vin=request.vin,
        )
        
        from agents.valuation_agent import valuation_agent
        result = await valuation_agent.valuate(legacy_request)
        
        if hasattr(result, 'dict'):
            result = result.dict()
        
        # Map to response
        adjustments = []
        for adj in result.get("adjustments", []):
            if isinstance(adj, dict):
                adjustments.append(AdjustmentItem(
                    factor=adj.get("factor", "unknown"),
                    amount=adj.get("amount", 0),
                    percentage=adj.get("percentage", 0),
                    reasoning=adj.get("reasoning", ""),
                ))
        
        return ValuateResponse(
            base_value=result.get("base_value", 0),
            final_value=result.get("final_value", 0),
            adjustments=adjustments,
            confidence=result.get("confidence", 0.8),
            explanation=result.get("explanation", ""),
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Valuation failed: {str(e)}"
        )


@router.post("/valuation/quick")
async def quick_valuation(
    request: ValuateRequest,
    api_key: str = Depends(verify_api_key),
    valuation_svc: ValuationService = Depends(get_valuation_service),
):
    """
    Quick valuation using only deterministic calculations.
    
    Faster than full valuation but less accurate.
    No LLM call required.
    """
    # Estimate base value from year and market data
    current_year = 2024
    age = current_year - request.year
    
    # Rough base value estimation
    base_values = {
        "renault": 180000,
        "dacia": 150000,
        "peugeot": 190000,
        "citroen": 175000,
        "volkswagen": 220000,
        "audi": 350000,
        "bmw": 400000,
        "mercedes": 450000,
    }
    
    base = base_values.get(request.make.lower(), 200000)
    
    # Apply depreciation (15% per year)
    depreciated = base * (0.85 ** age)
    
    # Apply adjustments
    mileage_adj = valuation_svc.calculate_mileage_adjustment(
        request.mileage, depreciated
    )
    condition_adj = valuation_svc.calculate_condition_adjustment(
        request.condition, depreciated
    )
    
    final_value = depreciated + mileage_adj["amount"] + condition_adj["amount"]
    
    return {
        "base_value": round(depreciated),
        "final_value": round(max(final_value, depreciated * 0.5)),  # Floor at 50%
        "adjustments": [mileage_adj, condition_adj],
        "confidence": 0.6,
        "explanation": "Quick estimation based on market averages and depreciation curves.",
    }
