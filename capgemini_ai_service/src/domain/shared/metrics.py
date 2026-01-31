"""
Win-Win Score Calculator and Metrics
Calculates the balance between customer satisfaction and dealer profitability.

This module provides the core metrics for ensuring fair negotiations:
- WinWinCalculator: Scores deals on a 0-100 scale
- EmotionalTrend: Tracks customer sentiment over conversation
- DealMetrics: Data class for deal financial analysis
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class DealMetrics:
    """
    Metrics for a single deal.
    
    Captures both dealer and customer perspectives:
    - Dealer: profit margin from vehicle sale
    - Customer: value received (discounts + fair trade-in)
    """
    vehicle_cost: float      # What dealer paid for the vehicle
    selling_price: float     # Final agreed price
    trade_in_given: float    # What we're offering for trade-in
    trade_in_market_value: float  # Actual market value of trade-in
    customer_satisfaction: float = 0.5  # 0-1 scale
    
    def calculate_dealer_margin(self) -> float:
        """
        Calculate dealer's profit margin percentage.
        
        Returns:
            Margin as percentage (e.g., 0.12 = 12%)
        """
        if self.vehicle_cost == 0:
            return 0.0
        
        # Profit = selling price - cost + (trade-in market - trade-in given)
        vehicle_profit = self.selling_price - self.vehicle_cost
        trade_in_profit = self.trade_in_market_value - self.trade_in_given
        total_profit = vehicle_profit + trade_in_profit
        
        return total_profit / self.vehicle_cost
    
    def calculate_customer_value(self) -> float:
        """
        Calculate value received by customer.
        
        Considers:
        - Discount from asking price
        - Fair (or above-market) trade-in value
        """
        # Trade-in premium: positive if we offer more than market
        trade_in_premium = self.trade_in_given - self.trade_in_market_value
        return trade_in_premium


class WinWinCalculator:
    """
    Calculates Win-Win score balancing dealer profitability and customer satisfaction.
    
    Score = 0-100 where:
    - 0-30: One-sided (either party loses significantly)
    - 31-50: Acceptable but not optimal
    - 51-70: IDEAL WIN-WIN ZONE ✓
    - 71-100: Likely too generous (margin too low)
    
    The goal is to find the sweet spot where both parties feel satisfied.
    """
    
    # Configurable thresholds
    MIN_MARGIN = 0.05       # 5% minimum dealer margin
    TARGET_MARGIN = 0.10    # 10% target margin
    MAX_MARGIN = 0.15       # 15% max before customer feels ripped off
    
    @classmethod
    def calculate_from_metrics(cls, metrics: DealMetrics) -> Dict[str, Any]:
        """
        Calculate win-win score from deal metrics.
        
        Returns comprehensive breakdown:
        - total_score: Overall 0-100 score
        - dealer_score: Dealer satisfaction (0-100)
        - customer_score: Customer satisfaction (0-100)
        - recommendation: Action suggestion
        """
        margin = metrics.calculate_dealer_margin()
        customer_value = metrics.calculate_customer_value()
        
        # Dealer score: Peaks at target margin
        if margin < cls.MIN_MARGIN:
            dealer_score = margin / cls.MIN_MARGIN * 30  # 0-30 if below minimum
        elif margin <= cls.TARGET_MARGIN:
            dealer_score = 30 + ((margin - cls.MIN_MARGIN) / 
                                 (cls.TARGET_MARGIN - cls.MIN_MARGIN) * 40)  # 30-70
        elif margin <= cls.MAX_MARGIN:
            dealer_score = 70 + ((margin - cls.TARGET_MARGIN) / 
                                 (cls.MAX_MARGIN - cls.TARGET_MARGIN) * 30)  # 70-100
        else:
            dealer_score = 100  # Above max margin
        
        # Customer score: Based on satisfaction and value
        base_customer_score = metrics.customer_satisfaction * 50
        
        # Bonus for trade-in premium
        if customer_value > 0:
            value_bonus = min(customer_value / 5000 * 20, 30)  # Up to 30 bonus
        else:
            value_bonus = max(customer_value / 5000 * 20, -20)  # Penalty if below market
        
        customer_score = min(100, max(0, base_customer_score + value_bonus + 30))
        
        # Win-Win score: Geometric mean (penalizes imbalance)
        total_score = (dealer_score * customer_score) ** 0.5
        
        return {
            "total_score": round(total_score, 1),
            "dealer_score": round(dealer_score, 1),
            "customer_score": round(customer_score, 1),
            "dealer_margin": round(margin * 100, 1),
            "recommendation": cls._get_recommendation(total_score, dealer_score, customer_score),
        }
    
    @classmethod
    def calculate_from_offer(
        cls,
        vehicle_price: float,
        vehicle_cost: float,
        trade_in_offered: float,
        trade_in_market_value: float,
        customer_emotion_score: float = 0.5,
        negotiation_rounds: int = 1,
    ) -> Dict[str, Any]:
        """
        Calculate win-win score from negotiation state.
        
        Convenience method for use during active negotiation.
        """
        metrics = DealMetrics(
            vehicle_cost=vehicle_cost,
            selling_price=vehicle_price,
            trade_in_given=trade_in_offered,
            trade_in_market_value=trade_in_market_value,
            customer_satisfaction=customer_emotion_score,
        )
        
        result = cls.calculate_from_metrics(metrics)
        
        # Adjust for negotiation fatigue (long negotiations reduce satisfaction)
        if negotiation_rounds > 5:
            fatigue_penalty = min((negotiation_rounds - 5) * 2, 15)
            result["total_score"] = max(0, result["total_score"] - fatigue_penalty)
            result["fatigue_penalty"] = fatigue_penalty
        
        return result
    
    @classmethod
    def estimate_from_monthly(
        cls,
        monthly_payment: float,
        duration_months: int,
        vehicle_cost: float,
        trade_in_value: float,
        customer_budget: float,
        customer_emotion_score: float = 0.5,
    ) -> Dict[str, Any]:
        """
        Estimate win-win score from monthly payment offer.
        
        Useful during negotiation when we don't have final price.
        """
        # Estimate total price from monthly (rough)
        estimated_price = monthly_payment * duration_months * 0.85  # Account for interest
        
        return cls.calculate_from_offer(
            vehicle_price=estimated_price,
            vehicle_cost=vehicle_cost,
            trade_in_offered=trade_in_value,
            trade_in_market_value=trade_in_value,  # Assume fair
            customer_emotion_score=customer_emotion_score,
        )
    
    @classmethod
    def _get_recommendation(
        cls, 
        total: float, 
        dealer: float, 
        customer: float
    ) -> str:
        """Get recommendation based on scores"""
        if total >= 50 and total <= 70:
            return "excellent_balance"
        elif dealer < 30:
            return "increase_price"
        elif customer < 30:
            return "offer_more_value"
        elif total > 70:
            return "acceptable_generous"
        else:
            return "needs_adjustment"


@dataclass
class EmotionalTrend:
    """
    Tracks emotional trend over conversation.
    
    Provides:
    - Direction: improving/declining/stable
    - Volatility: how much emotions fluctuate
    - Risk level: likelihood of deal falling through
    """
    history: List[Dict[str, Any]] = field(default_factory=list)
    
    def add_reading(
        self, 
        emotion: str, 
        intensity: float, 
        sentiment: float, 
        message: str = ""
    ):
        """Add a new emotional reading"""
        self.history.append({
            "emotion": emotion,
            "intensity": intensity,
            "sentiment": sentiment,
            "message": message,
            "timestamp": datetime.now().isoformat(),
        })
    
    def get_trend(self) -> Dict[str, Any]:
        """
        Analyze emotional trend over conversation.
        
        Returns:
        - direction: "improving", "declining", "stable", "volatile"
        - average_sentiment: Overall mood (-1 to 1)
        - volatility: How much emotions fluctuate (0-1)
        - risk_level: "low", "medium", "high"
        - recommendation: Suggested approach
        """
        if len(self.history) < 2:
            return {
                "direction": "stable",
                "average_sentiment": 0.5,
                "volatility": 0.0,
                "risk_level": "low",
                "recommendation": "Continue building rapport",
            }
        
        sentiments = [h["sentiment"] for h in self.history]
        avg_sentiment = sum(sentiments) / len(sentiments)
        
        # Calculate direction from recent trend
        recent = sentiments[-3:] if len(sentiments) >= 3 else sentiments
        if len(recent) >= 2:
            trend = recent[-1] - recent[0]
            if trend > 0.2:
                direction = "improving"
            elif trend < -0.2:
                direction = "declining"
            else:
                direction = "stable"
        else:
            direction = "stable"
        
        # Calculate volatility (standard deviation)
        if len(sentiments) > 1:
            mean = avg_sentiment
            variance = sum((s - mean) ** 2 for s in sentiments) / len(sentiments)
            volatility = variance ** 0.5
        else:
            volatility = 0.0
        
        # Determine volatility level
        if volatility > 0.4:
            direction = "volatile"
        
        # Risk assessment
        negative_count = sum(1 for s in sentiments if s < -0.2)
        if direction == "declining" and avg_sentiment < -0.2:
            risk_level = "high"
        elif negative_count >= len(sentiments) * 0.5:
            risk_level = "high"
        elif direction == "volatile" or avg_sentiment < 0:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            "direction": direction,
            "average_sentiment": round(avg_sentiment, 2),
            "volatility": round(volatility, 2),
            "risk_level": risk_level,
            "reading_count": len(self.history),
            "recommendation": self._get_emotional_recommendation(direction, risk_level),
        }
    
    def _get_emotional_recommendation(self, direction: str, risk: str) -> str:
        """Get recommendation based on emotional trend"""
        if risk == "high":
            return "De-escalate immediately. Acknowledge concerns before continuing."
        elif direction == "declining":
            return "Show empathy. Consider offering additional value."
        elif direction == "volatile":
            return "Stabilize conversation. Avoid pressure tactics."
        elif direction == "improving":
            return "Maintain momentum. Guide toward closing."
        else:
            return "Continue current approach."
    
    def get_average_sentiment(self) -> float:
        """Get average sentiment across conversation"""
        if not self.history:
            return 0.0
        return sum(h["sentiment"] for h in self.history) / len(self.history)
    
    def get_emotion_distribution(self) -> Dict[str, int]:
        """Get count of each emotion type"""
        distribution = {}
        for h in self.history:
            emotion = h["emotion"]
            distribution[emotion] = distribution.get(emotion, 0) + 1
        return distribution
