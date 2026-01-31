"""
Negotiation Service
Wraps the existing NegotiationAgent with dependency injection.

This is an adapter layer that allows:
1. Dependency injection of LLM and session store
2. Easy testing with mocks
3. Gradual migration from the legacy agent

The core logic remains in negotiation_agent.py for now to avoid
breaking changes during the hackathon.
"""
from typing import Dict, Any, Optional

from src.infrastructure.llm.base import BaseLLM
from src.infrastructure.repositories.base import SessionRepository
from src.domain.shared.types import EmotionType, NegotiationIntent, ConversationPhase


class NegotiationService:
    """
    Service layer adapter for negotiation functionality.
    
    For hackathon: This wraps the existing NegotiationAgent
    while enabling dependency injection for testing.
    
    Post-hackathon: Migrate all logic here.
    """
    
    def __init__(
        self,
        llm: BaseLLM,
        session_store: SessionRepository,
    ):
        self.llm = llm
        self.session_store = session_store
        
        # Lazy import the existing agent to avoid circular deps
        self._agent = None
    
    def _get_agent(self):
        """Lazy load the legacy agent"""
        if self._agent is None:
            from agents.negotiation.agent import negotiation_agent
            self._agent = negotiation_agent.NegotiationAgent()
        return self._agent
    
    async def negotiate(self, request) -> Dict[str, Any]:
        """
        Process a negotiation turn.
        
        Delegates to the existing NegotiationAgent for now.
        """
        agent = self._get_agent()
        result = await agent.negotiate(request)
        return result
    
    async def detect_emotion(self, message: str) -> Dict[str, Any]:
        """
        Detect customer emotion from message.
        
        Uses LLM to analyze emotional context.
        """
        prompt = f"""Analyze the emotional context of this customer message:

Message: "{message}"

Return JSON with:
- emotion: neutral|frustrated|happy|worried|budget_stressed|satisfied|excited|confused
- intensity: 0.0 to 1.0
- sentiment: -1.0 to 1.0
- concerns: [list of key concerns]
- recommended_tone: suggested response tone
"""
        
        response = await self.llm.invoke_structured(
            prompt=prompt,
            response_schema=EmotionalAnalysis,
            temperature=0.3,
        )
        
        return response.dict() if hasattr(response, 'dict') else response
    
    def detect_language(self, text: str) -> str:
        """Detect language from customer message (FR/EN/AR/MA)"""
        import re
        
        # Arabic script check
        if re.search(r'[\u0600-\u06FF]', text):
            # Check for Darija-specific words
            if re.search(r'\b(wach|bghit|bzaf|safi|mezyan|wakha|dyal|tomobil|3afak|chhal|flouss|familiya)\b', text, re.I):
                return "ma"
            return "ar"
        
        # Darija romanized
        if re.search(r'\b(wach|bghit|bzaf|safi|mezyan|wakha|dyal|tomobil|3afak|chhal|flouss|familiya)\b', text, re.I):
            return "ma"
        
        # French vs English
        fr_patterns = r'\b(bonjour|merci|voiture|prix|cher|moins|offre|accord|je veux|cherche|famille|budget)\b'
        en_patterns = r'\b(hello|hi|thanks|please|car|price|expensive|cheap|deal|ok|want|looking|need|family|budget)\b'
        
        fr_matches = len(re.findall(fr_patterns, text, re.I))
        en_matches = len(re.findall(en_patterns, text, re.I))
        
        if fr_matches > en_matches:
            return "fr"
        elif en_matches > fr_matches:
            return "en"
        
        return "fr"  # Default to French for Morocco
    
    def detect_intent(self, message: str, phase: str = "greeting") -> NegotiationIntent:
        """Classify customer intent"""
        message_lower = message.lower()
        
        # Greeting detection
        greetings = ["bonjour", "salut", "hello", "hi", "salam", "mrhba"]
        if phase == "greeting" and any(g in message_lower for g in greetings):
            return NegotiationIntent.GREETING
        
        # Budget mention
        if any(w in message_lower for w in ["budget", "moins de", "maximum", "up to", "afford"]):
            return NegotiationIntent.BUDGET_MENTION
        
        # Inquiry
        if any(w in message_lower for w in ["cherche", "looking for", "bghit", "interested"]):
            return NegotiationIntent.INQUIRY
        
        # Counter-offer (only in negotiation phase)
        if phase in ["presentation", "negotiation"]:
            if any(w in message_lower for w in ["cher", "expensive", "ghali", "discount", "moins"]):
                return NegotiationIntent.COUNTER_OFFER
        
        # Accept
        if phase == "negotiation":
            if any(w in message_lower for w in ["d'accord", "i accept", "deal", "wakha", "safi"]):
                return NegotiationIntent.ACCEPT
        
        # Reject
        if any(w in message_lower for w in ["non merci", "no thanks", "pas intéressé"]):
            return NegotiationIntent.REJECT
        
        return NegotiationIntent.REQUEST_INFO


# Pydantic model for structured LLM output
from pydantic import BaseModel
from typing import List


class EmotionalAnalysis(BaseModel):
    emotion: str
    intensity: float
    sentiment: float
    concerns: List[str]
    recommended_tone: str
