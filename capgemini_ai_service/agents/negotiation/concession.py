from typing import Dict, Any, Optional, Tuple
from schemas.types import NegotiationIntent, EmotionType
from schemas.models import EmotionalContextModel
from agents.strategies import get_strategy_for_intent
from core.logger import logger

class ConcessionEngine:
    """Calculates counter-offers and concessions based on strategy"""

    async def calculate_smart_concession(
        self, 
        current_offer: Dict[str, Any], 
        intent: NegotiationIntent,
        emotion: EmotionalContextModel,
        history_len: int,
        vehicle_cost: float,
        target_vehicle_price: float,
        session_budget: float = 0,
        trade_in_value: float = 0,
        customer_proposed_price: Optional[float] = None  # NEW: Customer's counter-offer amount
    ) -> Tuple[Optional[Dict[str, Any]], str]:
        """
        Uses Strategy Pattern to calculate move with robust floor price logic.
        Ensures dealer never goes below minimum margin.
        CRITICAL: Offers can only go DOWN during negotiation, never up.
        
        Args:
            customer_proposed_price: If client proposes a specific price (e.g., 123,000 MAD),
                                    the engine will try to meet them halfway or closer
        """
        
        # 1. Determine constraints
        # Minimum margin 3% or fixed amount
        min_margin_percent = 0.03
        floor_price = vehicle_cost * (1 + min_margin_percent)
        
        # Adjust floor if trade-in gives us buffer
        if trade_in_value > 0:
            # We can be more aggressive if we are getting a trade-in
            floor_price -= (trade_in_value * 0.05) # Use 5% of trade-in margin
        
        # Calculate current monthly based on stored full price (approximate)
        # This is simplified; in real world we'd need the full deal structure context
        current_monthly = current_offer.get("monthly", 0)
        
        # Estimate min monthly based on floor price
        # Assuming 60 months, 0 down for simple math or matching current duration
        duration = current_offer.get("duration", 60)
        interest_rate = 0.055 # 5.5% default
        
        # CRITICAL FIX: Detect if this is a CASH payment (no financing)
        # Cash payment: price ≈ monthly * duration (no interest markup)
        current_price = current_offer.get("price", target_vehicle_price)
        current_monthly_raw = current_offer.get("monthly", 0)
        is_cash_payment = False
        
        if current_monthly_raw > 0 and duration > 0:
            # If price is very close to monthly * duration, it's cash (no interest)
            expected_price_no_interest = current_monthly_raw * duration
            price_diff_percent = abs(current_price - expected_price_no_interest) / current_price
            if price_diff_percent < 0.02:  # Within 2% = cash payment
                is_cash_payment = True
                logger.debug("detected_cash_payment_mode", price=current_price, expected_no_interest=expected_price_no_interest)
        
        # Simple amortization for floor calculation
        if duration > 0:
            if is_cash_payment:
                # For cash: no interest, just divide floor price by duration
                min_monthly = floor_price / duration
                logger.debug("cash_mode_min_monthly", floor_price=floor_price, duration=duration, min_monthly=min_monthly)
            else:
                # For financing: apply interest
                min_monthly = (floor_price * (1 + (interest_rate * (duration/12)))) / duration
        else:
            min_monthly = floor_price # Cash buy scenario
            
        # 2. Select Strategy
        # If customer is angry/stressed, pick easier strategy
        # If customer is budget-focused, pick CostPlus
        strategy_name = "value_based"
        if intent == NegotiationIntent.BUDGET_MENTION or "budget" in emotion.primary_emotion.value:
            strategy_name = "cost_plus"
        
        strategy = get_strategy_for_intent(intent.value, emotion.primary_emotion.value)
        
        # 3. Parameters for strategy
        # Aggression: 0.2 (firm) to 0.6 (yielding) - INCREASED for better responsiveness
        # We use history_len to scale it: start higher, increase faster
        round_factor = min(1.0, history_len / 3) # 0.0 at start, 1.0 after 3 turns (faster)
        base_aggression = 0.25 + (0.15 * round_factor)  # Start at 25%, reach 40%
        
        # CRITICAL: Be MORE responsive to counter-offers and budget mentions
        if intent == NegotiationIntent.COUNTER_OFFER:
            base_aggression += 0.15  # Significant boost for counter-offers
        
        if intent == NegotiationIntent.BUDGET_MENTION:
            base_aggression += 0.12  # Show flexibility when budget is mentioned
        
        if emotion.sentiment_score < 0.4: # Angry/Frustrated
            base_aggression += 0.15  # Increased from 0.1
            
        if intent == NegotiationIntent.REJECT:
            base_aggression += 0.25  # Increased from 0.2
            
        params = {
            "min_monthly": min_monthly,
            "aggression": min(base_aggression, 0.7), # Safety cap increased to 0.7
            "vehicle_value": target_vehicle_price,
            "sentiment_score": emotion.sentiment_score
        }
        
        # 4. Calculate Move
        move = strategy.calculate_next_move(current_offer, params)
        logger.debug("strategy_move_calculated", concession_amount=move.concession_amount)
        
        # CRITICAL FIX: Ensure concession is NEVER negative (which would increase price)
        if move.concession_amount < 0:
            logger.warning("negative_concession_clamped", original_amount=move.concession_amount)
            move.concession_amount = 0
        
        # 4.0. INTELLIGENT CONCESSION: If customer proposed a specific price, negotiate towards it
        if customer_proposed_price and customer_proposed_price > 0:
            current_price = current_offer.get("price", target_vehicle_price)
            logger.info("counter_offer_extraction", customer_price=customer_proposed_price, current_price=current_price)
            
            # Check if proposed price is above floor
            if customer_proposed_price >= floor_price:
                # Customer's offer is acceptable! Meet them there or close
                price_gap = current_price - customer_proposed_price
                
                if price_gap > 0:  # We're higher than their offer
                    # Move 50-80% towards their price (depending on how close to floor)
                    margin_above_floor = (customer_proposed_price - floor_price) / floor_price
                    meet_percentage = 0.5 + min(0.3, margin_above_floor * 0.5)  # 50-80%
                    
                    concession_total = price_gap * meet_percentage
                    move.concession_amount = concession_total / (duration or 60)
                    logger.info("meeting_customer_price", meet_percentage=meet_percentage, concession_total=concession_total)
                    move.reasoning = f"Je peux faire un effort pour me rapprocher de votre proposition de {int(customer_proposed_price):,} MAD."
            else:
                # Proposed price is below floor - try to meet halfway between floor and current
                price_gap = current_price - floor_price
                if price_gap > 0:
                    concession_total = price_gap * 0.4  # Move 40% towards floor
                    move.concession_amount = concession_total / (duration or 60)
                    logger.info("counter_offer_below_floor", customer_price=customer_proposed_price, floor=floor_price)
                    move.reasoning = f"Je comprends votre budget, mais {int(customer_proposed_price):,} MAD est en dessous de notre prix minimum. Je peux descendre un peu plus, mais pas jusqu'à ce montant."
        
        # 4.1. HARD CAP: Allow up to 3% per step for counter-offers, 2% otherwise
        # This makes the AI more responsive to specific price requests
        if intent == NegotiationIntent.COUNTER_OFFER:
            max_step_percent = 0.03  # 3% for counter-offers
        else:
            max_step_percent = 0.025  # 2.5% for other intents
        
        max_step_concession_total = target_vehicle_price * max_step_percent
        max_step_concession_monthly = max_step_concession_total / (duration or 60)
        
        if move.concession_amount > max_step_concession_monthly:
            logger.info("concession_stepping_cap_applied", original=move.concession_amount, capped=max_step_concession_monthly)
            move.concession_amount = max_step_concession_monthly
        
        # 5. Validate Constraints (Safety Net)
        new_monthly = current_offer.get("monthly", 0) - move.concession_amount
        
        # MINIMUM STEP: Ensure if there is a concession, it's visible (at least 200 MAD total)
        # 200 / 60 months = ~3.33 MAD
        min_monthly_step = 200 / (duration or 60)
        if 0 < move.concession_amount < min_monthly_step:
            logger.debug("symbolic_concession_boosted", original=move.concession_amount, boosted=min_monthly_step)
            move.concession_amount = min_monthly_step
            new_monthly = current_offer.get("monthly", 0) - move.concession_amount

        # Make sure we don't go below floor
        if new_monthly < min_monthly:
            new_monthly = min_monthly
            reasoning = "C'est vraiment ma dernière offre, je ne peux pas descendre plus."
            move.reasoning = reasoning
        else:
            reasoning = move.reasoning
            
        # 6. Construct Offer
        # REDUCED threshold: Accept smaller concessions to show flexibility
        price_diff = current_offer.get("monthly", 0) - new_monthly
        
        if price_diff < 0.5: # Less than 0.5 MAD diff (reduced from 1.0)
            # Only refuse if we're truly at floor AND customer isn't insisting
            if new_monthly <= min_monthly and intent not in [NegotiationIntent.COUNTER_OFFER, NegotiationIntent.BUDGET_MENTION]:
                return None, "Je reste ferme sur ma position car le prix est déjà excellent."
            # Otherwise, make a tiny symbolic concession to show goodwill
            new_monthly = max(min_monthly, current_offer.get("monthly", 0) - 1.0)
            
        new_monthly = round(new_monthly, 2)
        
        # DEBUG: Log current offer state
        logger.debug("price_validation", current=current_offer.get('monthly', 0), new=new_monthly)
        
        # CRITICAL FIX: Calculate total price from CURRENT negotiated price, not from monthly
        # This prevents price drift and ensures prices only go DOWN
        current_total_price = current_offer.get("price", target_vehicle_price)
        
        # Calculate price reduction based on monthly concession
        monthly_reduction = current_offer.get("monthly", 0) - new_monthly
        total_price_reduction = monthly_reduction * (duration or 60)
        
        new_total_price = current_total_price - total_price_reduction
        
        # MANDATORY: Ensure price NEVER increases
        if new_total_price > current_total_price:
            logger.warning("price_regression_blocked", current=current_total_price, attempt=new_total_price)
            new_total_price = current_total_price
            new_monthly = current_total_price / (duration or 60)
        
        # Ensure we don't go below floor price (TOTAL, not monthly)
        # floor_price is monthly, so multiply by duration for total
        # BUT: for cash payments, floor_price should be the total floor
        floor_total_price = vehicle_cost * 1.03  # Direct total floor (cost + 3% margin)
        if new_total_price < floor_total_price:
            new_total_price = floor_total_price
            new_monthly = floor_total_price / (duration or 60)
        
        new_offer_dict = current_offer.copy()
        new_offer_dict["monthly"] = round(new_monthly, 2)
        new_offer_dict["price"] = round(new_total_price, 0)
        
        # Add alternatives flag if we are at floor
        if new_total_price <= floor_total_price * 1.02:  # Within 2% of floor
             new_offer_dict["suggest_alternatives"] = True
             
        return new_offer_dict, reasoning
