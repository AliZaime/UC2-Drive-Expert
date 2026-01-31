from typing import TYPE_CHECKING, Dict, Any
from schemas.types import NegotiationIntent, ConversationPhase

if TYPE_CHECKING:
    from core.session_store import NegotiationSession

class StateManager:
    """
    Manages negotiation state and phase transitions using intelligent readiness scores.
    SIMPLIFIED: Only 3 phases for better UX.
    """

    # Phase progression order - SIMPLIFIED
    PHASE_ORDER = ["discovery", "negotiation", "closing"]
    
    # Readiness thresholds (0.0 to 1.0)
    READINESS_THRESHOLDS = {
        "negotiation": 0.3,   # Low bar - move to price quickly
        "closing": 0.7       # Need clear accept/reject signal
    }

    def calculate_discovery_readiness(self, session: 'NegotiationSession') -> float:
        """
        Calculate how ready we are to move past discovery phase.
        Factors: Number of needs identified, messages exchanged, explicit interest signals.
        """
        score = 0.0
        
        # Factor 1: Customer needs identified (max 0.5)
        needs_count = len([k for k, v in session.customer_needs.items() if v])
        score += min(needs_count * 0.15, 0.5)
        
        # Factor 2: Conversation length (max 0.3) - but diminishing returns
        round_factor = min(session.negotiation_round * 0.1, 0.3)
        score += round_factor
        
        # Factor 3: Budget mentioned (0.2 bonus)
        if session.customer_needs.get('stated_budget'):
            score += 0.2
            
        return min(score, 1.0)

    def calculate_recommendation_readiness(self, 
                                           intent: NegotiationIntent, 
                                           session: 'NegotiationSession') -> float:
        """
        Calculate readiness to move from recommendation to presentation.
        Factors: Explicit vehicle interest, positive sentiment, time spent.
        """
        score = 0.0
        
        # Factor 1: Explicit vehicle interest intent (0.5)
        if intent == NegotiationIntent.VEHICLE_INTEREST:
            score += 0.5
            
        # Factor 2: Pre-selected vehicle exists (0.3)
        if session.target_vehicle_id:
            score += 0.3
            
        # Factor 3: Positive sentiment trend (0.2)
        if hasattr(session, 'emotional_trend') and session.emotional_trend:
            trend = session.emotional_trend.get_trend()
            if trend == "improving":
                score += 0.2
            elif trend == "declining":
                score -= 0.1
                
        return min(max(score, 0.0), 1.0)

    def calculate_presentation_readiness(self, intent: NegotiationIntent) -> float:
        """
        Calculate readiness to move from presentation to negotiation.
        Primarily triggered by price-related intents.
        """
        if intent in [NegotiationIntent.COUNTER_OFFER, NegotiationIntent.BUDGET_MENTION]:
            return 1.0
        if intent == NegotiationIntent.QUESTION:
            return 0.3  # Questions keep us in presentation
        return 0.0

    def calculate_closing_readiness(self, intent: NegotiationIntent) -> float:
        """
        Calculate readiness to close the deal.
        """
        if intent == NegotiationIntent.ACCEPT:
            return 1.0
        if intent == NegotiationIntent.REJECT:
            return 0.8  # Still move to closing, but for rejection handling
        return 0.0

    def determine_next_phase(self, 
                             message: str, 
                             intent: NegotiationIntent, 
                             session: 'NegotiationSession') -> str:
        """
        SIMPLIFIED: Only 3 phases - discovery, negotiation, closing.
        Fast and direct UX.
        """
        current_phase = session.conversation_phase
        msg_lower = message.lower()
        
        # === FAST TRANSITIONS ===
        
        # Accept/Reject → Closing
        if intent in [NegotiationIntent.ACCEPT, NegotiationIntent.REJECT]:
            return "closing"
        
        # Counter offer or price mention → Negotiation
        if intent in [NegotiationIntent.COUNTER_OFFER, NegotiationIntent.BUDGET_MENTION]:
            return "negotiation"
        
        # Asking for price → Negotiation (give them the price!)
        price_keywords = ["prix", "combien", "mensualité", "price", "cost", "chhal", "bchhal"]
        if any(w in msg_lower for w in price_keywords):
            return "negotiation"
        
        # === PHASE-SPECIFIC LOGIC ===
        
        if current_phase == "discovery":
            # After 2 turns or if needs identified, move to negotiation
            if session.negotiation_round >= 2:
                return "negotiation"
            # If interested in specific vehicle, move to negotiation
            if intent == NegotiationIntent.VEHICLE_INTEREST:
                return "negotiation"
            return "discovery"
        
        elif current_phase == "negotiation":
            # Stay in negotiation until accept/reject
            return "negotiation"
        
        elif current_phase == "closing":
            return "closing"
        
        # Default: start with discovery
        return "discovery"

    def can_regress_phase(self, current_phase: str, target_phase: str) -> bool:
        """
        Check if regression to an earlier phase is allowed.
        Used for cyclic workflows (e.g., user wants different car).
        """
        current_idx = self.PHASE_ORDER.index(current_phase) if current_phase in self.PHASE_ORDER else 0
        target_idx = self.PHASE_ORDER.index(target_phase) if target_phase in self.PHASE_ORDER else 0
        
        # Allow regression from negotiation back to recommendation (different car)
        # Allow regression from presentation back to discovery (more questions)
        allowed_regressions = [
            ("negotiation", "recommendation"),
            ("negotiation", "discovery"),
            ("presentation", "discovery"),
            ("recommendation", "discovery")
        ]
        
        return (current_phase, target_phase) in allowed_regressions
