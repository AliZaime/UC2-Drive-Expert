"""
Win-Win Score Calculator and Metrics
Calculates the balance between customer satisfaction and dealer profitability
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class DealOutcome(str, Enum):
    """Possible deal outcomes"""
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    PENDING = "pending"
    ABANDONED = "abandoned"


@dataclass
class DealMetrics:
    """Metrics for a single deal"""
    vehicle_cost: float  # Dealer's cost
    selling_price: float  # Final agreed price
    trade_in_given: float  # What we gave for trade-in
    trade_in_market_value: float  # Actual market value of trade-in
    
    # Customer perception (from survey or inference)
    customer_satisfaction: float = 0.5  # 0-1 scale
    
    def calculate_dealer_margin(self) -> float:
        """Calculate dealer's profit margin percentage"""
        if self.selling_price == 0:
            return 0.0
        
        # Profit = Selling Price - Vehicle Cost - (Trade-in Given - Trade-in Value)
        trade_in_loss = max(0, self.trade_in_given - self.trade_in_market_value)
        profit = self.selling_price - self.vehicle_cost - trade_in_loss
        margin = (profit / self.selling_price) * 100
        return round(margin, 2)
    
    def calculate_customer_value(self) -> float:
        """Calculate value received by customer (discount + fair trade-in)"""
        # Assuming MSRP is cost * 1.25 (25% standard markup)
        msrp = self.vehicle_cost * 1.25
        discount_received = msrp - self.selling_price
        trade_in_fairness = self.trade_in_given - (self.trade_in_market_value * 0.9)  # vs lowball
        
        return discount_received + max(0, trade_in_fairness)


class WinWinCalculator:
    """
    Calculates Win-Win score balancing dealer profitability and customer satisfaction
    
    Score = 0-100 where:
    - 0-30: One-sided (either party loses)
    - 31-50: Acceptable but not optimal
    - 51-70: Good balance
    - 71-85: Great deal for both
    - 86-100: Exceptional (rare)
    """
    
    # Configurable thresholds
    MIN_DEALER_MARGIN = 3.0  # Minimum acceptable margin %
    TARGET_DEALER_MARGIN = 8.0  # Target margin %
    MAX_DEALER_MARGIN = 15.0  # Above this, customer may be overpaying
    
    @classmethod
    def calculate_from_metrics(cls, metrics: DealMetrics) -> Dict[str, Any]:
        """Calculate win-win score from deal metrics"""
        
        dealer_margin = metrics.calculate_dealer_margin()
        customer_satisfaction = metrics.customer_satisfaction
        
        # Dealer score (0-50 points)
        if dealer_margin < cls.MIN_DEALER_MARGIN:
            dealer_score = dealer_margin / cls.MIN_DEALER_MARGIN * 20  # Max 20 if below minimum
        elif dealer_margin <= cls.TARGET_DEALER_MARGIN:
            # Linear scale from 20 to 50 between min and target
            dealer_score = 20 + ((dealer_margin - cls.MIN_DEALER_MARGIN) / 
                                 (cls.TARGET_DEALER_MARGIN - cls.MIN_DEALER_MARGIN)) * 30
        else:
            # Above target, slight penalty for potential customer overpay
            excess = min(dealer_margin - cls.TARGET_DEALER_MARGIN, 10)
            dealer_score = 50 - (excess * 1.5)  # Max penalty of 15 points
        
        # Customer score (0-50 points)
        customer_score = customer_satisfaction * 50
        
        # Combined win-win score
        total_score = dealer_score + customer_score
        
        # Balance penalty (both should win, not just one)
        balance_diff = abs(dealer_score - customer_score)
        if balance_diff > 20:
            # Significant imbalance
            penalty = (balance_diff - 20) * 0.5
            total_score -= penalty
        
        total_score = max(0, min(100, total_score))
        
        return {
            "win_win_score": round(total_score, 1),
            "dealer_score": round(dealer_score, 1),
            "customer_score": round(customer_score, 1),
            "dealer_margin_percent": dealer_margin,
            "is_balanced": balance_diff <= 20,
            "recommendation": cls._get_recommendation(total_score, dealer_score, customer_score)
        }
    
    @classmethod
    def calculate_from_offer(cls, 
                             vehicle_price: float,
                             vehicle_cost: float,
                             trade_in_offered: float,
                             trade_in_market_value: float,
                             customer_emotion_score: float = 0.5,
                             negotiation_rounds: int = 1) -> Dict[str, Any]:
        """
        Calculate win-win score from negotiation state
        
        Args:
            vehicle_price: Current offered price
            vehicle_cost: Dealer's cost for the vehicle
            trade_in_offered: What we're offering for trade-in
            trade_in_market_value: Fair market value of trade-in
            customer_emotion_score: Current customer sentiment (-1 to 1, normalized to 0-1)
            negotiation_rounds: Number of back-and-forth rounds
        """
        
        # Normalize emotion score to 0-1
        customer_satisfaction = (customer_emotion_score + 1) / 2
        
        # Bonus for quick resolution
        if negotiation_rounds <= 2:
            customer_satisfaction = min(1.0, customer_satisfaction + 0.1)
        elif negotiation_rounds > 5:
            customer_satisfaction = max(0, customer_satisfaction - 0.1)
        
        metrics = DealMetrics(
            vehicle_cost=vehicle_cost,
            selling_price=vehicle_price,
            trade_in_given=trade_in_offered,
            trade_in_market_value=trade_in_market_value,
            customer_satisfaction=customer_satisfaction
        )
        
        return cls.calculate_from_metrics(metrics)
    
    @classmethod
    def estimate_from_monthly(cls,
                               monthly_payment: float,
                               duration_months: int,
                               vehicle_cost: float,
                               trade_in_value: float,
                               customer_budget: float,
                               customer_emotion_score: float = 0.5) -> Dict[str, Any]:
        """
        Estimate win-win score from monthly payment offer
        Useful during negotiation when we don't have final price
        """
        
        # Estimate selling price from monthly (rough approximation)
        estimated_total = monthly_payment * duration_months
        interest_estimate = estimated_total * 0.08  # Assume ~8% total interest
        estimated_selling_price = estimated_total - interest_estimate + trade_in_value
        
        # Customer satisfaction based on budget fit
        budget_fit = 1 - min(1, max(0, (monthly_payment - customer_budget) / customer_budget))
        
        # Combine with emotional score
        customer_satisfaction = (budget_fit * 0.6) + ((customer_emotion_score + 1) / 2 * 0.4)
        
        metrics = DealMetrics(
            vehicle_cost=vehicle_cost,
            selling_price=estimated_selling_price,
            trade_in_given=trade_in_value,
            trade_in_market_value=trade_in_value * 0.95,  # Assume fair valuation
            customer_satisfaction=customer_satisfaction
        )
        
        return cls.calculate_from_metrics(metrics)
    
    @classmethod
    def _get_recommendation(cls, total: float, dealer: float, customer: float) -> str:
        """Get recommendation based on scores"""
        
        if total >= 70:
            return "Excellent deal for both parties. Proceed to close."
        elif total >= 50:
            if dealer < customer:
                return "Good for customer, consider holding firm on price."
            elif customer < dealer:
                return "Good margin but customer may need more value. Consider add-ons."
            return "Balanced deal. Good to proceed."
        elif total >= 30:
            if dealer < 20:
                return "Margin too low. Need to recover value or walk away."
            elif customer < 20:
                return "Customer unsatisfied. Offer concession or alternatives."
            return "Deal needs work. Identify pain points."
        else:
            return "Poor deal. Consider restructuring or walking away."


@dataclass
class EmotionalTrend:
    """Tracks emotional trend over conversation"""
    history: List[Dict[str, Any]] = field(default_factory=list)
    
    def add_reading(self, emotion: str, intensity: float, sentiment: float, message: str = ""):
        """Add a new emotional reading"""
        self.history.append({
            "timestamp": datetime.now().isoformat(),
            "emotion": emotion,
            "intensity": intensity,
            "sentiment": sentiment,
            "message_snippet": message[:50] if message else ""
        })
    
    def get_trend(self) -> Dict[str, Any]:
        """Analyze emotional trend over conversation"""
        if not self.history:
            return {
                "trend": "neutral",
                "direction": "stable",
                "volatility": 0.0,
                "current_sentiment": 0.0,
                "risk_level": "low"
            }
        
        sentiments = [r["sentiment"] for r in self.history]
        intensities = [r["intensity"] for r in self.history]
        
        # Current state
        current_sentiment = sentiments[-1]
        current_intensity = intensities[-1]
        
        # Trend direction (comparing recent to earlier)
        if len(sentiments) >= 3:
            early_avg = sum(sentiments[:len(sentiments)//2]) / (len(sentiments)//2)
            recent_avg = sum(sentiments[len(sentiments)//2:]) / (len(sentiments) - len(sentiments)//2)
            
            if recent_avg > early_avg + 0.2:
                direction = "improving"
            elif recent_avg < early_avg - 0.2:
                direction = "declining"
            else:
                direction = "stable"
        else:
            direction = "insufficient_data"
        
        # Volatility (how much emotions swing)
        if len(sentiments) >= 2:
            diffs = [abs(sentiments[i] - sentiments[i-1]) for i in range(1, len(sentiments))]
            volatility = sum(diffs) / len(diffs)
        else:
            volatility = 0.0
        
        # Risk assessment
        if current_sentiment < -0.5 or (direction == "declining" and current_intensity > 0.7):
            risk_level = "high"
        elif current_sentiment < 0 or direction == "declining":
            risk_level = "medium"
        else:
            risk_level = "low"
        
        # Determine overall trend
        if current_sentiment > 0.3:
            trend = "positive"
        elif current_sentiment < -0.3:
            trend = "negative"
        else:
            trend = "neutral"
        
        return {
            "trend": trend,
            "direction": direction,
            "volatility": round(volatility, 2),
            "current_sentiment": round(current_sentiment, 2),
            "current_intensity": round(current_intensity, 2),
            "risk_level": risk_level,
            "readings_count": len(self.history),
            "recommendation": self._get_emotional_recommendation(trend, direction, risk_level)
        }
    
    def _get_emotional_recommendation(self, trend: str, direction: str, risk: str) -> str:
        """Get recommendation based on emotional trend"""
        
        if risk == "high":
            return "Customer frustrated. Slow down, acknowledge concerns, consider significant concession."
        elif direction == "declining":
            return "Customer losing interest. Reframe value proposition or offer alternatives."
        elif trend == "positive" and direction == "improving":
            return "Strong momentum. Move towards closing."
        elif trend == "neutral":
            return "Engaged but not excited. Highlight key benefits matching their priorities."
        else:
            return "Continue current approach."
    
    def get_average_sentiment(self) -> float:
        """Get average sentiment across conversation"""
        if not self.history:
            return 0.0
        return sum(r["sentiment"] for r in self.history) / len(self.history)
    
    def get_emotion_distribution(self) -> Dict[str, int]:
        """Get count of each emotion type"""
        distribution = {}
        for reading in self.history:
            emotion = reading["emotion"]
            distribution[emotion] = distribution.get(emotion, 0) + 1
        return distribution
