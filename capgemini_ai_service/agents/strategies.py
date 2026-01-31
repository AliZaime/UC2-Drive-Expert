"""
Negotiation Strategy Definitions
Decouples the logic of "how to concede" from the agent execution.
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class NegotiationMove(BaseModel):
    concession_amount: float
    reasoning: str
    tone: str
    tactics: list[str]

class MarketContext:
    """
    Context factors that influence negotiation dynamics.
    In a real system, these would be fetched from external sources.
    """
    @staticmethod
    def get_context() -> Dict[str, Any]:
        now = datetime.now()
        return {
            "is_end_of_month": now.day >= 25,  # More pressure to close deals
            "is_end_of_quarter": now.month in [3, 6, 9, 12] and now.day >= 20,
            "is_weekend": now.weekday() >= 5,
            "season": "high" if now.month in [4, 5, 9, 10] else "normal"  # Car buying seasons
        }

class NegotiationStrategy:
    """Base class for negotiation strategies"""
    
    @staticmethod
    def calculate_next_move(
        current_offer: Dict[str, Any], 
        params: Dict[str, Any]
    ) -> NegotiationMove:
        raise NotImplementedError

class ValueBasedStrategy(NegotiationStrategy):
    """
    Strategy for customers who care about value/quality over raw price.
    Retains price but offers add-ons.
    """
    @staticmethod
    def calculate_next_move(current_offer: Dict[str, Any], params: Dict[str, Any]) -> NegotiationMove:
        # If margin is healthy, offer maintenance or accessories instead of dropping price
        return NegotiationMove(
            concession_amount=0.0,
            reasoning="Customer values quality; offering service pack retains value while satisfying need for a 'win'.",
            tone="confident_but_generous",
            tactics=["value_framing", "service_bundling"]
        )

class CostPlusStrategy(NegotiationStrategy):
    """
    Dynamic strategy that adjusts based on market conditions and customer sentiment.
    Calculates from floor price with context-aware aggression.
    """
    @staticmethod
    def calculate_next_move(current_offer: Dict[str, Any], params: Dict[str, Any]) -> NegotiationMove:
        current_monthly = current_offer.get("monthly", 0)
        min_monthly = params.get("min_monthly", current_monthly * 0.9)
        
        # === DYNAMIC AGGRESSION ===
        # Base aggression: Low (0.2) to keep drops gradual
        base_aggression = params.get("aggression", 0.2)
        
        # Adjust for market conditions
        market = MarketContext.get_context()
        if market["is_end_of_quarter"]: base_aggression += 0.1
            
        # Adjust for customer sentiment
        sentiment_score = params.get("sentiment_score", 0.5)
        if sentiment_score < 0.3: base_aggression += 0.1
            
        # Clamp aggression to valid range (Stingy mode)
        aggression = max(0.05, min(base_aggression, 0.4))
        
        # === CALCULATE MOVE ===
        diff = max(0, current_monthly - min_monthly)
        drop = diff * aggression
        
        # Ensure new_monthly is actually lower than current_monthly
        # Round to nearest integer for cleaner numbers
        new_monthly = round(current_monthly - drop)
        
        # Guard against zero/negative drop due to rounding
        if new_monthly >= current_monthly and current_monthly > min_monthly:
            new_monthly = current_monthly - 1.0 # Minimal symbolic drop
        
        return NegotiationMove(
            concession_amount=max(0, current_monthly - new_monthly),
            reasoning=f"Un geste commercial pour s'adapter à votre budget.",
            tone="cooperative",
            tactics=["reciprocity", "anchoring"]
        )

class EmpatheticStrategy(NegotiationStrategy):
    """
    Strategy for stressed or frustrated customers.
    Prioritizes emotional connection but stays professional.
    """
    @staticmethod
    def calculate_next_move(current_offer: Dict[str, Any], params: Dict[str, Any]) -> NegotiationMove:
        current_monthly = current_offer.get("monthly", 0)
        min_monthly = params.get("min_monthly", current_monthly * 0.9)
        
        # More conservative concession (0.25)
        aggression = 0.25
        diff = max(0, current_monthly - min_monthly)
        drop = diff * aggression
        
        return NegotiationMove(
            concession_amount=max(0, drop),
            reasoning="Je comprends votre situation. Je vais faire un pas vers vous.",
            tone="empathetic_and_supportive",
            tactics=["active_listening", "flexibility_showcase"]
        )

# Factory to pick strategy based on intent, emotion, and context
def get_strategy_for_intent(intent: str, emotion: str) -> NegotiationStrategy:
    """
    Select the appropriate strategy based on customer signals.
    """
    emotion_lower = emotion.lower() if emotion else ""
    intent_lower = intent.lower() if intent else ""
    
    # Stressed/frustrated customers get empathetic approach
    if any(e in emotion_lower for e in ["frustrated", "stressed", "angry", "worried"]):
        return EmpatheticStrategy()
    
    # Budget-focused or specific counter-offers get cost-plus
    if any(i in intent_lower for i in ["counter_offer", "budget_mention", "price_objection", "price"]):
        return CostPlusStrategy()
        
    # Default to value-based
    return ValueBasedStrategy()
