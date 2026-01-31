"""
Valuation Service
Wraps the existing ValuationAgent with dependency injection.
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel
from src.infrastructure.llm.base import BaseLLM


class ValuationRequest(BaseModel):
    """Input for vehicle valuation"""
    make: str
    model: str
    year: int
    mileage: int
    condition: str = "good"
    extras: Optional[list] = None


class ValuationResult(BaseModel):
    """Structured valuation output"""
    base_value: float
    final_value: float
    adjustments: list
    confidence: float
    explanation: str


class ValuationService:
    """
    Service for vehicle trade-in valuations.
    
    Wraps existing ValuationAgent with DI support.
    """
    
    def __init__(self, llm: BaseLLM):
        self.llm = llm
        self._agent = None
    
    def _get_agent(self):
        """Lazy load legacy agent"""
        if self._agent is None:
            from agents.valuation_agent import ValuationAgent
            self._agent = ValuationAgent()
        return self._agent
    
    async def valuate(self, request: ValuationRequest) -> Dict[str, Any]:
        """
        Perform vehicle valuation.
        
        Delegates to existing ValuationAgent.
        """
        agent = self._get_agent()
        
        # Convert to dict for legacy agent
        request_dict = request.dict()
        
        result = await agent.valuate(request_dict)
        return result
    
    def calculate_mileage_adjustment(
        self,
        mileage: int,
        base_value: float,
        expected_mileage: int = 15000
    ) -> Dict[str, Any]:
        """
        Calculate mileage-based value adjustment.
        
        Pure function - no LLM needed.
        """
        excess_km = mileage - expected_mileage
        
        if excess_km <= 0:
            # Low mileage premium
            premium_rate = 0.01  # 1% per 5000km under
            adjustment = abs(excess_km) // 5000 * base_value * premium_rate
            adjustment = min(adjustment, base_value * 0.05)  # Cap at 5%
            return {
                "type": "mileage_premium",
                "amount": adjustment,
                "percentage": round(adjustment / base_value * 100, 1),
                "reasoning": f"Low mileage ({mileage:,} km vs {expected_mileage:,} expected)"
            }
        else:
            # High mileage deduction
            deduction_rate = 0.015  # 1.5% per 10000km over
            adjustment = -(excess_km // 10000 * base_value * deduction_rate)
            adjustment = max(adjustment, -base_value * 0.20)  # Cap at -20%
            return {
                "type": "mileage_deduction",
                "amount": adjustment,
                "percentage": round(adjustment / base_value * 100, 1),
                "reasoning": f"High mileage ({mileage:,} km vs {expected_mileage:,} expected)"
            }
    
    def calculate_condition_adjustment(
        self,
        condition: str,
        base_value: float
    ) -> Dict[str, Any]:
        """
        Calculate condition-based value adjustment.
        """
        condition_factors = {
            "excellent": 0.05,
            "very_good": 0.02,
            "good": 0.0,
            "fair": -0.05,
            "poor": -0.15,
        }
        
        factor = condition_factors.get(condition.lower(), 0.0)
        adjustment = base_value * factor
        
        return {
            "type": "condition_adjustment",
            "amount": adjustment,
            "percentage": round(factor * 100, 1),
            "reasoning": f"Vehicle condition rated as '{condition}'"
        }
