"""
Pydantic models for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from schemas.types import EmotionType, NegotiationIntent

class VehicleData(BaseModel):
    """Trade-in vehicle information"""
    make: str
    model: str
    year: int
    mileage: int
    condition: str
    service_history: bool = False
    accidents: bool = False
    vin: Optional[str] = None


class ValuationRequestModel(BaseModel):
    """API model for valuation request"""
    trade_in_id: str
    vehicle: VehicleData
    photos: Optional[List[str]] = []

class AdjustmentDetail(BaseModel):
    """Valuation adjustment explanation"""
    factor: str
    amount: float
    percentage: float
    reasoning: str

class ValuationBreakdownModel(BaseModel):
    """Detailed valuation breakdown"""
    base_price: float
    adjustments: List[AdjustmentDetail]
    market_comparables: int
    confidence: float
    final_value: float

class AgentStepModel(BaseModel):
    """Agent execution step for transparency"""
    agent_name: str
    action: str
    reasoning: str
    data: Dict[str, Any]
    confidence: float
    timestamp: datetime = Field(default_factory=datetime.now)

class ValuationResponseModel(BaseModel):
    """API response for valuation"""
    trade_in_id: str
    estimated_value: float
    value_range: Dict[str, float]
    breakdown: ValuationBreakdownModel
    market_analysis: Dict[str, Any]
    confidence: float
    explanation: str
    agent_steps: List[AgentStepModel]

class EmotionalContextModel(BaseModel):
    """Emotional intelligence analysis"""
    primary_emotion: EmotionType
    intensity: float = Field(ge=0.0, le=1.0)
    sentiment_score: float = Field(ge=-1.0, le=1.0)
    key_concerns: List[str]
    recommended_tone: str
    recommended_strategy: str
    detected_language: Optional[str] = "fr"  # NEW: Language detected by LLM (fr/en/ar/ma)

class NegotiationRequestModel(BaseModel):
    """API request for negotiation turn"""
    session_id: str
    customer_id: Optional[str] = "anonymous"
    customer_message: str
    conversation_history: List[Dict[str, str]] = []
    current_offer: Optional[Dict[str, Any]] = None
    
    # Context from orchestrator (passed on first turn)
    vehicle_context: Optional[Dict[str, Any]] = None  # Primary vehicle for negotiation
    trade_in_context: Optional[Dict[str, Any]] = None  # {trade_in_id, value}
    profile_context: Optional[Dict[str, Any]] = None  # From profiling agent
    
    # NEW: For vehicle comparison feature - backend sends multiple vehicles
    comparison_vehicles: Optional[List[Dict[str, Any]]] = None  # List of vehicles to compare

class VehicleCardModel(BaseModel):
    """Structured vehicle data for frontend display"""
    name: str  # e.g. "Peugeot 208"
    year: int = 2024
    price: float = 0
    condition: str = ""
    mileage: int = 0
    features: List[str] = []
    specifications: Dict[str, Any] = {}
    location: str = ""

class NegotiationResponseModel(BaseModel):
    """API response for negotiation"""
    session_id: str
    agent_message: str
    detected_language: str = "fr"  # FR/EN/AR/MA - Multi-language support
    emotional_analysis: EmotionalContextModel
    intent_detected: NegotiationIntent
    new_offer: Optional[Dict[str, Any]] = None
    alternatives: List[Dict[str, Any]] = []
    reasoning: str
    confidence: float
    agent_steps: List[AgentStepModel]
    should_finalize: bool = False
    emotional_trend: str = "stable"  # "improving", "declining", "stable", "volatile"
    emotional_trend_details: Optional[Dict[str, Any]] = None  # Full trend data for UI
    win_win_score: float = 0.0  # 0-100 score for deal balance
    negotiation_round: int = 0  # Current round number
    session_summary: Optional[Dict[str, Any]] = None  # Optional full session state for UI
    
    # NEW: Structured vehicle data for frontend display
    vehicle_card: Optional[VehicleCardModel] = None

class CustomerPreferences(BaseModel):
    """Customer vehicle preferences"""
    vehicle_type: str
    min_seats: Optional[int] = None
    monthly_budget: float
    financing_preference: str
    priorities: List[str] = []

class TradeInDataModel(BaseModel):
    """Trade-in vehicle data for valuation"""
    make: str
    model: str
    year: int
    mileage: int
    condition: str = "Bon"
    service_history: bool = False
    accidents: bool = False
    vin: Optional[str] = None

class DealStructuringRequestModel(BaseModel):
    """API request for deal structuring"""
    vehicle_price: float = Field(description="Vehicle price in MAD")
    trade_in_value: float = Field(default=0.0, description="Trade-in value in MAD")
    preferences: CustomerPreferences

class OrchestratorRequestModel(BaseModel):
    """API request to start orchestration"""
    customer_id: str
    trade_in_id: Optional[str] = None
    trade_in_data: Optional[TradeInDataModel] = None  # Actual vehicle data for valuation
    preferences: CustomerPreferences

class OrchestratorResponseModel(BaseModel):
    """API response from orchestrator"""
    session_id: str
    status: str
    valuation: Optional[ValuationResponseModel] = None
    customer_profile: Optional[Dict[str, Any]] = None
    vehicle_matches: List[Dict[str, Any]] = []
    deal_options: List[Dict[str, Any]] = []
    initial_offer: Dict[str, Any] = {}
    agent_steps: List[AgentStepModel] = []
    win_win_score: float = 0.0
    emotional_trend: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    timestamp: datetime = Field(default_factory=datetime.now)
    groq_connected: bool
