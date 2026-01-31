"""
Negotiation Strategy Definitions
Decouples the logic of "how to concede" from the service execution.

Uses Strategy Pattern to allow different negotiation approaches:
- ValueBasedStrategy: For customers who value quality over price
- CostPlusStrategy: Standard price-focused negotiation
"""
from typing import Dict, Any
from pydantic import BaseModel
from abc import ABC, abstractmethod


class NegotiationMove(BaseModel):
    """Result of a strategy calculation"""
    concession_amount: float
    reasoning: str
    tone: str
    tactics: list[str]


class NegotiationStrategy(ABC):
    """Base class for negotiation strategies"""
    
    @staticmethod
    @abstractmethod
    def calculate_next_move(
        current_offer: Dict[str, Any], 
        params: Dict[str, Any]
    ) -> NegotiationMove:
        """Calculate the next negotiation move based on current state"""
        pass


class ValueBasedStrategy(NegotiationStrategy):
    """
    Strategy for customers who care about value/quality over raw price.
    
    Instead of dropping price, offers:
    - Extended warranties
    - Service packages
    - Accessories
    
    Preserves margin while giving customer perceived win.
    """
    
    @staticmethod
    def calculate_next_move(
        current_offer: Dict[str, Any], 
        params: Dict[str, Any]
    ) -> NegotiationMove:
        return NegotiationMove(
            concession_amount=0.0,
            reasoning="Customer values quality; offering service pack retains value while satisfying need for a 'win'.",
            tone="confident_but_generous",
            tactics=["value_framing", "service_bundling"]
        )


class CostPlusStrategy(NegotiationStrategy):
    """
    Standard strategy calculating from floor price.
    
    Dynamically adjusts concession based on:
    - Remaining margin (distance to floor)
    - Customer patience/urgency
    - Number of negotiation rounds
    """
    
    @staticmethod
    def calculate_next_move(
        current_offer: Dict[str, Any], 
        params: Dict[str, Any]
    ) -> NegotiationMove:
        current_monthly = current_offer.get("monthly", 0)
        min_monthly = params.get("min_monthly", current_monthly * 0.9)
        
        # Dynamic aggression: 1.0 = drop to floor immediately, 0.0 = hold firm
        aggression = params.get("aggression", 0.5)
        
        diff = current_monthly - min_monthly
        drop = diff * aggression
        
        # Round to nice numbers (nearest 10)
        new_monthly = round(current_monthly - drop, -1)
        
        if new_monthly <= min_monthly + 10:
            return NegotiationMove(
                concession_amount=current_monthly - min_monthly,
                reasoning="Reached floor price. Final offer.",
                tone="firm_but_polite",
                tactics=["final_offer_framing", "walk_away_warning"]
            )
        
        return NegotiationMove(
            concession_amount=drop,
            reasoning=f"Standard concession of {drop:.0f} MAD based on aggression {aggression}",
            tone="cooperative",
            tactics=["reciprocity", "anchoring"]
        )


class EmpathyStrategy(NegotiationStrategy):
    """
    Strategy for emotionally distressed customers.
    
    Prioritizes relationship over immediate margin:
    - Acknowledges concerns explicitly
    - Offers small symbolic concessions
    - Focuses on long-term customer relationship
    """
    
    @staticmethod
    def calculate_next_move(
        current_offer: Dict[str, Any], 
        params: Dict[str, Any]
    ) -> NegotiationMove:
        current_monthly = current_offer.get("monthly", 0)
        
        # Small symbolic concession (5%)
        concession = current_monthly * 0.05
        
        return NegotiationMove(
            concession_amount=concession,
            reasoning="Customer emotionally distressed; small gesture builds trust.",
            tone="warm_and_understanding",
            tactics=["empathy_first", "symbolic_win"]
        )


def get_strategy_for_context(
    intent: str, 
    emotion: str,
    price_sensitivity: str = "medium"
) -> NegotiationStrategy:
    """
    Factory function to select appropriate strategy.
    
    Args:
        intent: Customer's detected intent
        emotion: Customer's current emotion
        price_sensitivity: High/Medium/Low
    
    Returns:
        Appropriate NegotiationStrategy instance
    """
    # High emotional distress → empathy first
    if emotion.lower() in ["frustrated", "angry", "budget_stressed", "worried"]:
        return EmpathyStrategy()
    
    # Price-focused customer → cost-based negotiation
    if "budget" in emotion.lower() or "price" in intent.lower():
        return CostPlusStrategy()
    
    # Quality-focused or neutral → value-based
    return ValueBasedStrategy()
