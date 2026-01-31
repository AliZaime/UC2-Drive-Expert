"""
Shared Domain Components
Cross-cutting concerns used by multiple domain services.
"""
from src.domain.shared.types import (
    ConversationPhase,
    EmotionType,
    NegotiationIntent,
)
from src.domain.shared.metrics import WinWinCalculator, EmotionalTrend, DealMetrics

__all__ = [
    "ConversationPhase",
    "EmotionType", 
    "NegotiationIntent",
    "WinWinCalculator",
    "EmotionalTrend",
    "DealMetrics",
]
