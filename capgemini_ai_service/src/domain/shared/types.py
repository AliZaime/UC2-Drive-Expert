"""
Domain Types and Enums
Core type definitions used across the domain layer.
"""
from enum import Enum
from typing import TypedDict, List, Optional, Dict, Any
from datetime import datetime


class ConversationPhase(str, Enum):
    """Phases of a human-like car sales conversation"""
    GREETING = "greeting"           # Initial contact, welcome
    DISCOVERY = "discovery"         # Understanding needs, budget, preferences
    RECOMMENDATION = "recommendation"  # Suggesting vehicles from inventory
    PRESENTATION = "presentation"   # Detailing selected vehicle
    NEGOTIATION = "negotiation"     # Price/terms discussion
    CLOSING = "closing"             # Finalizing or ending


class EmotionType(str, Enum):
    """Customer emotional states"""
    NEUTRAL = "neutral"
    HAPPY = "happy"
    FRUSTRATED = "frustrated"
    EXCITED = "excited"
    WORRIED = "worried"
    BUDGET_STRESSED = "budget_stressed"
    CONFUSED = "confused"
    SATISFIED = "satisfied"


class NegotiationIntent(str, Enum):
    """Customer intent classification"""
    GREETING = "greeting"              # Hello, initial contact
    INQUIRY = "inquiry"                # Asking about cars, features
    BUDGET_MENTION = "budget_mention"  # Stating budget or price range
    VEHICLE_INTEREST = "vehicle_interest"  # Interest in specific vehicle
    COUNTER_OFFER = "counter_offer"
    ACCEPT = "accept"
    REJECT = "reject"
    REQUEST_INFO = "request_info"
    EXPRESS_CONCERN = "express_concern"
    REQUEST_ALTERNATIVE = "request_alternative"


class DealOutcome(str, Enum):
    """Possible deal outcomes"""
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    PENDING = "pending"
    ABANDONED = "abandoned"


# TypedDict definitions for structured data

class AgentStep(TypedDict):
    """Single agent execution step with explanation"""
    agent_name: str
    action: str
    reasoning: str
    data: Dict[str, Any]
    confidence: float
    timestamp: datetime


class EmotionalContext(TypedDict):
    """Customer emotional analysis"""
    primary_emotion: EmotionType
    intensity: float  # 0.0 to 1.0
    sentiment_score: float  # -1.0 (negative) to 1.0 (positive)
    key_concerns: List[str]
    recommended_tone: str
    recommended_strategy: str


class ValuationBreakdown(TypedDict):
    """Detailed valuation explanation"""
    base_price: float
    adjustments: List[Dict[str, Any]]  # {factor, amount, percentage, reasoning}
    market_comparables: int
    confidence: float
    final_value: float


class NegotiationState(TypedDict):
    """LangGraph state for negotiation workflow"""
    # Session info
    session_id: str
    status: Optional[str]
    customer_id: str
    trade_in_id: Optional[str]
    target_vehicle_id: Optional[str]
    
    # Customer data
    customer_preferences: Dict[str, Any]
    trade_in_data: Optional[Dict[str, Any]]
    
    # Conversation
    conversation_history: List[Dict[str, str]]
    current_message: str
    
    # Emotional intelligence
    emotional_context: Optional[EmotionalContext]
    intent: Optional[NegotiationIntent]
    
    # Agent outputs
    valuation_result: Optional[Dict[str, Any]]
    customer_profile: Optional[Dict[str, Any]]
    vehicle_matches: Optional[List[Dict[str, Any]]]
    deal_options: Optional[List[Dict[str, Any]]]
    
    # Negotiation state
    current_offer: Optional[Dict[str, Any]]
    negotiation_round: int
    min_acceptable_terms: Dict[str, Any]
    max_concession_limit: Dict[str, Any]
    
    # Explainability
    agent_steps: List[AgentStep]
    decision_tree: List[Dict[str, Any]]
    
    # Metrics
    win_win_score: Optional[float]
    customer_satisfaction_estimate: Optional[float]
    dealer_margin: Optional[float]
    
    # Control flow
    next_action: str
    should_continue: bool
    error: Optional[str]
