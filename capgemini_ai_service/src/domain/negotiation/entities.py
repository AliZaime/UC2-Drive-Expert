from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime
from src.domain.shared.metrics import EmotionalTrend, WinWinCalculator

@dataclass
class CustomerProfile:
    """Evolving customer profile that updates during conversation"""
    segment: str = "Unknown"
    price_sensitivity: str = "Medium"
    priorities: List[str] = field(default_factory=list)
    communication_style: str = "Professional"
    inferred_budget: float = 0.0
    confidence: float = 0.5
    
    # Progressive insights
    mentioned_concerns: List[str] = field(default_factory=list)
    positive_reactions: List[str] = field(default_factory=list)
    objections_raised: List[str] = field(default_factory=list)
    
    def update_from_message(self, message: str, emotion: str, intent: str):
        """Update profile based on new message analysis"""
        message_lower = message.lower()
        
        # Detect concerns
        concern_keywords = {
            "cher": "price concern",
            "budget": "budget constraint", 
            "famille": "family needs",
            "sécurité": "safety priority",
            "consommation": "fuel economy",
            "fiabilité": "reliability concern",
            "garantie": "warranty interest"
        }
        for keyword, concern in concern_keywords.items():
            if keyword in message_lower and concern not in self.mentioned_concerns:
                self.mentioned_concerns.append(concern)
        
        # Update price sensitivity
        if any(w in message_lower for w in ["trop cher", "dépasse", "budget serré"]):
            self.price_sensitivity = "High"
        elif any(w in message_lower for w in ["qualité", "meilleur", "premium"]):
            self.price_sensitivity = "Low"
        
        # Track objections
        if intent == "COUNTER_OFFER" or intent == "REJECT":
            if len(self.objections_raised) < 10:
                self.objections_raised.append(message[:100])
        
        # Track positive reactions
        if emotion in ["happy", "excited", "satisfied"]:
            if len(self.positive_reactions) < 10:
                self.positive_reactions.append(message[:50])
        
        self.confidence = min(0.95, self.confidence + 0.05)
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass 
class NegotiationSession:
    """Complete state for a negotiation session"""
    session_id: str
    customer_id: str
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    # Conversation phase tracking
    conversation_phase: str = "greeting"
    
    # Discovery data
    customer_needs: Dict[str, Any] = field(default_factory=dict)
    stated_budget: Optional[float] = None
    budget_type: str = "monthly"
    interested_vehicles: List[str] = field(default_factory=list)
    
    # Vehicle context
    target_vehicle_id: Optional[str] = None
    target_vehicle_name: Optional[str] = None  # Added for better UX
    target_vehicle_price: float = 0.0
    vehicle_cost: float = 0.0
    
    # Vehicle Details (Expanded for persistence)
    vehicle_features: List[str] = field(default_factory=list)
    vehicle_specs: Dict[str, Any] = field(default_factory=dict)
    vehicle_year: int = 2024
    vehicle_condition: str = ""
    vehicle_mileage: int = 0
    vehicle_location: str = ""
    
    # Comparisons
    comparison_vehicles: List[Dict[str, Any]] = field(default_factory=list)
    
    # Trade-in
    trade_in_id: Optional[str] = None
    trade_in_value: float = 0.0
    
    # Current offer state
    current_monthly: float = 0.0
    current_duration: int = 60
    current_down_payment: float = 0.0
    negotiated_price: Optional[float] = None
    payment_preference: Optional[str] = None # NEW: 'cash' or 'credit'
    customer_proposed_price: Optional[float] = None # NEW: Specific price proposed by customer
    offer_history: List[Dict[str, Any]] = field(default_factory=list)
    
    # Conversation history
    conversation_history: List[Dict[str, Any]] = field(default_factory=list)
    negotiation_round: int = 0
    
    # Profile and Emotion
    customer_profile: CustomerProfile = field(default_factory=CustomerProfile)
    emotional_trend: EmotionalTrend = field(default_factory=EmotionalTrend)
    
    # Status and metrics
    status: str = "active"
    win_win_score: Optional[float] = None
    
    # NEW: Persistent Language (detect once, stick to it)
    language: Optional[str] = None
    
    # NEW: Frustration detection
    repeated_intents: List[str] = field(default_factory=list)  # Track last 5 intents
    frustration_level: int = 0  # 0-10 scale
    
    def add_message(self, speaker: str, message: str, 
                    emotion: Optional[str] = None, 
                    intent: Optional[str] = None,
                    sentiment: float = 0.0,
                    intensity: float = 0.5):
        self.conversation_history.append({
            "speaker": speaker,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "emotion": emotion,
            "intent": intent
        })
        
        if speaker == "customer" and emotion:
            self.emotional_trend.add_reading(
                emotion=emotion,
                intensity=intensity,
                sentiment=sentiment,
                message=message
            )
            self.customer_profile.update_from_message(message, emotion, intent or "")
        
        if speaker == "customer":
            self.negotiation_round += 1
            # Auto-detect payment preference
            msg_low = message.lower()
            if any(w in msg_low for w in ["cash", "comptant", "une fois", "un coup", "direct"]):
                self.payment_preference = "cash"
            elif any(w in msg_low for w in ["mensuel", "mois", "crédit", "financement", "échelon"]):
                self.payment_preference = "credit"
        
        self.updated_at = datetime.now()
    
    def record_offer(self, monthly: float, duration: int, down_payment: float = 0,
                      concession_reason: str = "", price: float = None):
        if price:
            self.negotiated_price = price
        elif self.negotiated_price is None:
            self.negotiated_price = self.target_vehicle_price

        self.offer_history.append({
            "monthly": monthly,
            "duration": duration,
            "down_payment": down_payment,
            "price": self.negotiated_price,
            "round": self.negotiation_round,
            "timestamp": datetime.now().isoformat(),
            "reason": concession_reason
        })
        self.current_monthly = monthly
        self.current_duration = duration
        self.current_down_payment = down_payment
        self.updated_at = datetime.now()

    # ─────────────────────────────────────────────────────────────
    # Properties for compatibility with routes and session store
    # ─────────────────────────────────────────────────────────────
    
    @property
    def is_finalized(self) -> bool:
        """Check if negotiation has ended (accepted, rejected, or expired)"""
        return self.status in ["accepted", "rejected", "expired"]
    
    @property
    def current_offer(self) -> Dict[str, Any]:
        """Get current offer as a dictionary"""
        return {
            "monthly": self.current_monthly,
            "duration": self.current_duration,
            "down_payment": self.current_down_payment,
            "vehicle_id": self.target_vehicle_id,
            "vehicle_price": self.target_vehicle_price,
            "price": self.negotiated_price or self.target_vehicle_price,
            "trade_in_value": self.trade_in_value
        }
    
    @property
    def current_phase(self) -> str:
        """Alias for conversation_phase for API compatibility"""
        return self.conversation_phase
    
    @property
    def outcome(self) -> Optional[str]:
        """Get negotiation outcome if finalized"""
        if self.status == "accepted":
            return "deal_closed"
        elif self.status == "rejected":
            return "customer_walkaway"
        elif self.status == "expired":
            return "session_timeout"
        return None
    
    def get_summary(self) -> Dict[str, Any]:
        """Get a summary of the negotiation session for API responses"""
        return {
            "session_id": self.session_id,
            "customer_id": self.customer_id,
            "phase": self.conversation_phase,
            "status": self.status,
            "outcome": self.outcome,
            "rounds": self.negotiation_round,
            "final_offer": {
                "monthly": self.current_monthly,
                "duration": self.current_duration,
                "down_payment": self.current_down_payment
            },
            "vehicle": {
                "id": self.target_vehicle_id,
                "price": self.target_vehicle_price
            },
            "trade_in": {
                "id": self.trade_in_id,
                "value": self.trade_in_value
            },
            "customer_profile": {
                "segment": self.customer_profile.segment,
                "price_sensitivity": self.customer_profile.price_sensitivity,
                "priorities": self.customer_profile.priorities
            },
            "emotional_trend": self.emotional_trend.get_trend(),
            "win_win_score": self.win_win_score,
            "message_count": len(self.conversation_history),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['created_at'] = self.created_at.isoformat()
        data['updated_at'] = self.updated_at.isoformat()
        # Handle complex objects recursion
        data['customer_profile'] = self.customer_profile.to_dict()
        data['emotional_trend_history'] = self.emotional_trend.history
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "NegotiationSession":
        session = cls(
            session_id=data["session_id"],
            customer_id=data["customer_id"]
        )
        session.created_at = datetime.fromisoformat(data["created_at"])
        session.updated_at = datetime.fromisoformat(data["updated_at"])
        # ... map all other fields
        for field in ["conversation_phase", "target_vehicle_id", "target_vehicle_name", 
                     "target_vehicle_price", "vehicle_cost", "trade_in_id", 
                     "trade_in_value", "current_monthly", "current_duration", 
                     "current_down_payment", "negotiated_price", "offer_history", 
                     "conversation_history", "negotiation_round", "status", "win_win_score",
                     "customer_needs", "stated_budget", "budget_type", "interested_vehicles", "language",
                     "vehicle_features", "vehicle_specs", "vehicle_year", 
                     "vehicle_condition", "vehicle_mileage", "vehicle_location",
                     "comparison_vehicles", "customer_proposed_price"]:  
            if field in data:
                setattr(session, field, data[field])
        
        if "customer_profile" in data:
            session.customer_profile = CustomerProfile(**data["customer_profile"])
        if "emotional_trend_history" in data:
            session.emotional_trend = EmotionalTrend(history=data["emotional_trend_history"])
            
        return session
