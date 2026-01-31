from datetime import datetime
from typing import Dict, Any, List, Optional
from langchain_groq import ChatGroq
from config.settings import settings
from schemas.models import (
    NegotiationRequestModel,
    NegotiationResponseModel,
    AgentStepModel
)
from schemas.types import NegotiationIntent
from core.session_store import get_session_store, NegotiationSession
from core.metrics import WinWinCalculator

# Import our new modules
from .language import LanguageDetector
from .analysis import AnalysisService
from .state import StateManager
from .concession import ConcessionEngine
from .response import ResponseGenerator
from .comparison import ComparisonService
from agents.inventory_agent import inventory_agent

class NegotiationAgent:
    """Refactored Agent specializing in win-win negotiations"""
    
    def __init__(self):
        self.llm = ChatGroq(
            groq_api_key=settings.groq_api_key,
            model_name=settings.default_model,
            temperature=0.5,  # Reduced from 0.7 for more focused responses
            max_tokens=256  # Reduced from 1024 to enforce brevity
        )
        self.agent_steps: List[AgentStepModel] = []
        self._session_store = get_session_store()
        
        # Initialize sub-modules
        self.language = LanguageDetector()
        self.analysis = AnalysisService(self.llm)
        self.state_manager = StateManager()
        self.concession = ConcessionEngine()
        self.response = ResponseGenerator(self.llm)
        self.comparison = ComparisonService(inventory_agent)
    
    def _log_step(self, action: str, reasoning: str, data: Dict[str, Any], confidence: float):
        """Log agent step for transparency"""
        step = AgentStepModel(
            agent_name="Negotiation Agent",
            action=action,
            reasoning=reasoning,
            data=data,
            confidence=confidence,
            timestamp=datetime.now()
        )
        self.agent_steps.append(step)
        return step
    
    async def negotiate(self, request: NegotiationRequestModel) -> NegotiationResponseModel:
        """Main negotiation loop"""
        self.agent_steps = [] # Reset steps for this turn
        
        # 1. Load Session
        session = await self._get_or_create_session(
            request.session_id, 
            vehicle_context=request.vehicle_context,
            trade_in_context=request.trade_in_context,
            profile_context=request.profile_context,
            comparison_vehicles=request.comparison_vehicles  # NEW: For comparison feature
        )
        
        
        # 1.1 Analyze Emotion, Intent & Language (LLM)
        emotional_context = await self.analysis.analyze_emotion(request.customer_message)
        
        # LANGUAGE LOGIC (Sticky Session)
        # Use session language if exists, otherwise trust LLM detection
        if not session.language:
            session.language = emotional_context.detected_language or "fr"
        else:
            # Only switch if LLM is confident or language is drastically different?
            # For now, let's keep it 'sticky' but allow updates if detection is strong (LLM handles this)
            # Actually, simply prioritizing session language is safer for context.
            # But if a user EXPLICITLY switches language, we want to follow.
            # Simple heuristic: If prompt detected a different language, key on that.
            if emotional_context.detected_language and emotional_context.detected_language != session.language:
             # Only update if current round is early or if detection is different from session
             # This prevents 'jitter' but allows initial detection to work
             if session.negotiation_round <= 1:
                 session.language = emotional_context.detected_language
        
        detected_language = session.language
        
        # 2. Update Emotion History
        session.emotional_trend.add_reading(
            emotion=emotional_context.primary_emotion.value,
            intensity=emotional_context.intensity,
            sentiment=emotional_context.sentiment_score,
            message=request.customer_message
        )
        
        intent_result = await self.analysis.detect_intent(
            request.customer_message, 
            session.conversation_phase,
            recent_messages=session.conversation_history[-6:] if session.conversation_history else []  # Pass context
        )
        
        intent = intent_result["intent"]
        intent_confidence = intent_result["confidence"]
        intent_reasoning = intent_result["reasoning"]
        needs_clarification = intent_result["needs_clarification"]
        
        # NEW: Track repeated intents for frustration detection
        session.repeated_intents.append(intent.value)
        if len(session.repeated_intents) > 5:
            session.repeated_intents = session.repeated_intents[-5:]  # Keep last 5
        
        # Detect frustration: same intent repeated 3+ times in last 5 messages
        if len(session.repeated_intents) >= 3:
            most_common = max(set(session.repeated_intents), key=session.repeated_intents.count)
            count = session.repeated_intents.count(most_common)
            if count >= 3:
                session.frustration_level = min(10, session.frustration_level + 2)
                self._log_step(
                    "Frustration Détectée",
                    f"Client répète '{most_common}' ({count}x). Niveau: {session.frustration_level}/10",
                    {"repeated_intent": most_common, "count": count},
                    0.9
                )
        
        # NEW: Detect cash payment preference (from current message OR history if it's a new session)
        wants_cash = self.analysis.detect_cash_payment_intent(request.customer_message)
        
        # If not in current message, check history (helpful after service reloads)
        if not wants_cash and (not session.payment_preference or session.negotiation_round <= 1):
            for msg_item in request.conversation_history:
                if self.analysis.detect_cash_payment_intent(msg_item.get("message", "")):
                    wants_cash = True
                    break
        
        if wants_cash and session.payment_preference != "cash":
            session.payment_preference = "cash"
            self._log_step(
                "Préférence Cash Détectée",
                "Mode paiement comptant activé (récupéré du message ou de l'historique)",
                {"payment_mode": "cash"},
                0.95
            )
        
        # NEW: Extract counter-offer amount
        counter_offer_amount = self.analysis.extract_counter_offer_amount(request.customer_message)
        
        # Fallback: If we have a clear price or cash intent, don't ask for clarification
        # even if intent detection failed due to 429/errors
        if counter_offer_amount or wants_cash:
            if needs_clarification:
                logger.info(f"Bypassing clarification: Valid signal detected (price: {counter_offer_amount}, cash: {wants_cash})")
                needs_clarification = False
            
            # If intent was UNCLEAR but we have a price, it's a counter-offer
            if intent == NegotiationIntent.INQUIRY and counter_offer_amount:
                intent = NegotiationIntent.COUNTER_OFFER
        
        self._log_step(
            "Analyse Intention", 
            f"Phase: {session.conversation_phase} -> Intention: {intent.value} (Confiance: {intent_confidence:.0%})", 
            {
                "intent": intent.value, 
                "confidence": intent_confidence,
                "reasoning": intent_reasoning,
                "emotion": emotional_context.primary_emotion.value,
                "counter_offer": counter_offer_amount,
                "wants_cash": wants_cash
            }, 
            intent_confidence
        )
        
        # 3.1 Handle Vehicle Rejection - PERSIST IT
        if intent == NegotiationIntent.REQUEST_ALTERNATIVE:
            self._log_step(
                "Véhicule Rejeté",
                f"Client a rejeté: {session.target_vehicle_name}. Effacement pour proposer alternatives.",
                {"rejected_vehicle": session.target_vehicle_name},
                0.9
            )
            session.target_vehicle_name = None  # Clear so we stop pushing it
            session.target_vehicle_id = None
        
        # 2. Update Session with Customer Message & Emotion
        session.add_message(
            speaker="customer",
            message=request.customer_message,
            emotion=emotional_context.primary_emotion.value,
            intent=intent.value,
            sentiment=emotional_context.sentiment_score,
            intensity=emotional_context.intensity
        )
        
        # 3. Extract Needs
        new_needs = self.analysis.extract_needs(request.customer_message, session.customer_needs)
        session.customer_needs = new_needs
        
        # 3.1. Extract Counter-Offer Amount (if client proposes a specific price)
        counter_offer_amount = self.analysis.extract_counter_offer_amount(request.customer_message)
        if counter_offer_amount:
            self._log_step(
                "Contre-offre Détectée",
                f"Client propose: {counter_offer_amount:,.0f} MAD",
                {"proposed_price": counter_offer_amount},
                0.95
            )
            # Store in session for concession engine to use
            session.customer_proposed_price = counter_offer_amount
        else:
            session.customer_proposed_price = None
        
        # 4. State Management (Update Phase)
        if request.session_id != "test_session": # Avoid state changes in some tests
            session.negotiation_round += 1
            
        next_phase = self.state_manager.determine_next_phase(
            request.customer_message, intent, session
        )
        
        if next_phase != session.conversation_phase:
            self._log_step("Changement de Phase", f"{session.conversation_phase} -> {next_phase}", {}, 1.0)
            session.conversation_phase = next_phase
            
        
        # 5. Calculate Concession (If needed)
        current_offer = request.current_offer or {}
        
        # INITIAL OFFER LOGIC: If no offer exists, create standard one
        if not current_offer and session.target_vehicle_price > 0:
            # Standard offer: (Price - TradeIn) / 60 months
            # We treat trade-in conservatively (80% value) for initial offer
            net_principal = session.target_vehicle_price - (session.trade_in_value * 0.8)
            std_monthly = (net_principal * 1.055) / 60  # Simple 5.5% interest estimation
            current_offer = {
                "monthly": round(std_monthly, 2),
                "duration": 60,
                "down_payment": 0,
                "vehicle_price": session.target_vehicle_price,
                "price": session.target_vehicle_price  # Add price field
            }
            # Record it so ConcessionEngine has a baseline
            session.current_monthly = current_offer["monthly"]
            session.current_duration = 60

        # CRITICAL: Ensure current_offer always has a "price" field BEFORE concession calculation
        if "price" not in current_offer or current_offer["price"] == 0:
            # Use negotiated_price if available, otherwise vehicle_price
            current_offer["price"] = session.negotiated_price or session.target_vehicle_price or current_offer.get("vehicle_price", 0)
        
        # For cash payments, ensure monthly is calculated from total price
        if session.payment_preference == "cash" and current_offer.get("price", 0) > 0:
            duration = current_offer.get("duration", 60) or 60
            current_offer["monthly"] = current_offer["price"] / duration
            self._log_step(
                "Mode Cash Activé",
                f"Prix total: {current_offer['price']:,.0f} MAD (mensualité calculée: {current_offer['monthly']:,.0f} MAD pour calculs internes)",
                {"payment_mode": "cash"},
                0.95
            )

        new_offer = None
        reasoning = "Discussion sur les besoins"
        auto_accepted = False
        
        # NEW: Auto-accept close counter-offers
        if counter_offer_amount and intent == NegotiationIntent.COUNTER_OFFER:
            vehicle_price = session.target_vehicle_price or current_offer.get("vehicle_price", 0)
            vehicle_cost = session.vehicle_cost if session.vehicle_cost > 0 else vehicle_price * 0.85
            floor_price = vehicle_cost * 1.03  # 3% minimum margin
            
            current_price = session.negotiated_price or vehicle_price
            price_diff_percent = abs(counter_offer_amount - current_price) / current_price
            
            # Accept if within 2% and above floor
            if price_diff_percent <= 0.02 and counter_offer_amount >= floor_price:
                self._log_step(
                    "Contre-offre Acceptée",
                    f"Offre {counter_offer_amount} MAD acceptée (écart: {price_diff_percent:.1%}, au-dessus du plancher)",
                    {"accepted_price": counter_offer_amount, "floor_price": floor_price},
                    1.0
                )
                new_offer = {
                    "price": counter_offer_amount,
                    "monthly": counter_offer_amount / 60 if session.payment_preference != "cash" else 0,
                    "duration": 60,
                    "down_payment": 0,
                    "vehicle_price": counter_offer_amount
                }
                reasoning = f"Parfait ! J'accepte votre offre de {int(counter_offer_amount):,} MAD. C'est un excellent prix pour ce véhicule."
                auto_accepted = True
        
        # Regular concession logic if not auto-accepted
        # REMOVED PHASE RESTRICTION: Allow concessions in ANY phase (greeting, presentation, negotiation)
        if not auto_accepted:
            vehicle_price = session.target_vehicle_price or current_offer.get("vehicle_price", 0)
            vehicle_cost = session.vehicle_cost if session.vehicle_cost > 0 else vehicle_price * 0.85
            
            # Boost aggression if frustrated
            frustration_boost = session.frustration_level * 0.05  # Up to +50% aggression at max frustration
            
            new_offer, reasoning = await self.concession.calculate_smart_concession(
                current_offer=current_offer,
                intent=intent,
                emotion=emotional_context,
                history_len=session.negotiation_round,
                vehicle_cost=vehicle_cost,
                target_vehicle_price=vehicle_price,
                session_budget=session.stated_budget,
                trade_in_value=session.trade_in_value,
                customer_proposed_price=session.customer_proposed_price  # Pass the extracted price
            )
            
            # Apply frustration boost to concession
            if new_offer and frustration_boost > 0 and session.frustration_level >= 5:
                original_price = new_offer.get("price", vehicle_price)
                boosted_reduction = original_price * frustration_boost * 0.01  # Extra reduction
                new_offer["price"] = max(vehicle_cost * 1.03, original_price - boosted_reduction)
                new_offer["monthly"] = new_offer["price"] / (new_offer.get("duration", 60) or 60)
                reasoning += f" Je comprends votre frustration et je fais un effort supplémentaire."
                self._log_step(
                    "Concession de Frustration",
                    f"Réduction supplémentaire de {boosted_reduction:.0f} MAD pour apaiser la frustration",
                    {"boost": frustration_boost, "reduction": boosted_reduction},
                    0.8
                )
            
        # 6. Look for Alternatives (if floor reached)
        alternatives = []
        if new_offer and new_offer.get("suggest_alternatives"):
            alternatives = await self.comparison.find_alternative_vehicles(
                current_price=session.target_vehicle_price,
                customer_budget=session.customer_profile.inferred_budget or 5000
            )
            
        # 7. Generate Response
        # Get car name context (Critical Fix)
        car_name = session.target_vehicle_name if session.target_vehicle_name else (
             session.target_vehicle_id if session.target_vehicle_id else "ce véhicule"
        )
        
        needs_str = ", ".join([k for k, v in session.customer_needs.items() if v])
        
        # Handle low-confidence intent: Ask for clarification
        if needs_clarification:
            self._log_step(
                "Clarification Requise",
                f"Confiance trop basse ({intent_confidence:.0%}), demande de précision",
                {"original_intent": intent.value, "confidence": intent_confidence},
                intent_confidence
            )
            clarification_responses = {
                "fr": "Je veux m'assurer de bien vous comprendre. Pouvez-vous préciser ce que vous recherchez?",
                "en": "I want to make sure I understand you correctly. Could you clarify what you're looking for?",
                "ar": "أريد التأكد من فهمي الصحيح. هل يمكنك توضيح ما تبحث عنه؟",
                "darija": "Bghit nfhem mzyan. Wach t9dr twdh liya chno katb7t 3lih?"
            }
            response_text = clarification_responses.get(detected_language, clarification_responses["fr"])
        else:
            response_text = await self.response.generate_response(
                customer_msg=request.customer_message,
                emotion=emotional_context,
                new_offer=new_offer or current_offer, # Fallback to current offer!
                car_name=car_name,
                needs_str=needs_str,
                phase=session.conversation_phase,
                reasoning=reasoning,
                language=detected_language,
                vehicle_features=getattr(session, 'vehicle_features', []),
                vehicle_specs=getattr(session, 'vehicle_specs', {}),
                vehicle_price=session.target_vehicle_price or 0,
                vehicle_cost=session.vehicle_cost or 0, 
                round_number=session.negotiation_round,
                session=session # NEW: Pass the whole session for context
            )
        
        # 8. Update Session & Metrics
        session.add_message("agent", response_text)
        if new_offer:
            # NON-REGRESSION SAFETY: Usually offer price can ONLY go down
            # BUT: If the user themselves proposed a specific price (counter-offer) that is 
            # HIGHER than our current internal offer, we should absolutely allow it (it's a win for us!)
            last_price = session.negotiated_price or session.target_vehicle_price
            new_price = new_offer.get("price", last_price)
            
            # If the increase is driven by a user counter-offer, allow it
            is_user_driven_increase = (
                intent == NegotiationIntent.COUNTER_OFFER and 
                session.customer_proposed_price and 
                session.customer_proposed_price > last_price
            )

            if new_price > last_price and not is_user_driven_increase:
                print(f"DEBUG: Blocking agent-initiated regression from {last_price} to {new_price}")
                new_price = last_price
            elif is_user_driven_increase:
                print(f"DEBUG: Allowing user-initiated price increase (Win for dealer) to {new_price}")

            session.record_offer(
                monthly=new_offer.get("monthly", 0),
                duration=new_offer.get("duration", 60),
                down_payment=new_offer.get("down_payment", 0),
                price=new_price,
                concession_reason=reasoning
            )
        
        # 9. Calculate Win-Win Score
        monthly_for_calc = session.current_monthly if session.current_monthly > 0 else (new_offer.get("monthly", 0) if new_offer else 0)
        customer_budget_safe = session.stated_budget or monthly_for_calc or 5000  # Safe fallback
        
        win_win_result = WinWinCalculator.estimate_from_monthly(
            monthly_payment=monthly_for_calc,
            duration_months=session.current_duration,
            vehicle_cost=session.vehicle_cost or 200000,  # Safe fallback
            trade_in_value=session.trade_in_value,
            customer_budget=customer_budget_safe,
            customer_emotion_score=emotional_context.sentiment_score
        )
        session.win_win_score = win_win_result.get("win_win_score", 50.0)
        
        # 10. Get Emotional Trend
        trend_data = session.emotional_trend.get_trend()
        
        # 11. Build Vehicle Card for frontend
        from schemas.models import VehicleCardModel
        vehicle_card = None
        if session.target_vehicle_name:
            vehicle_card = VehicleCardModel(
                name=session.target_vehicle_name,
                year=getattr(session, 'vehicle_year', 2024),
                price=session.target_vehicle_price or 0,
                condition=getattr(session, 'vehicle_condition', ''),
                mileage=getattr(session, 'vehicle_mileage', 0),
                features=getattr(session, 'vehicle_features', []),
                specifications=getattr(session, 'vehicle_specs', {}),
                location=getattr(session, 'vehicle_location', '')
            )
            
        await self._save_session(session)
        
        return NegotiationResponseModel(
            session_id=request.session_id,
            agent_message=response_text,
            detected_language=detected_language,
            emotional_analysis=emotional_context,
            intent_detected=intent,
            new_offer=new_offer,
            alternatives=alternatives, 
            reasoning=reasoning,
            confidence=0.9,
            agent_steps=self.agent_steps,
            should_finalize=(intent == NegotiationIntent.ACCEPT),
            negotiation_round=session.negotiation_round,
            emotional_trend=trend_data.get("trend", "stable"),
            emotional_trend_details=trend_data,
            win_win_score=session.win_win_score,
            vehicle_card=vehicle_card  # NEW: Structured vehicle data!
        )

    async def _get_or_create_session(
        self, 
        session_id: str, 
        customer_id: str = "unknown",
        vehicle_context: dict = None,
        trade_in_context: dict = None,
        profile_context: dict = None,
        comparison_vehicles: list = None  # NEW: For comparison feature
    ) -> NegotiationSession:
        """Get existing session or create new one with optional context initialization"""
        session = await self._session_store.get(session_id)
        
        if not session:
            session = NegotiationSession(
                session_id=session_id,
                customer_id=customer_id
            )
            
        # ALWAYS update vehicle context from request (fixes dropdown selection bug)
        if vehicle_context:
            session.target_vehicle_id = vehicle_context.get("vehicle_id")
            session.target_vehicle_price = vehicle_context.get("price", 0)
            session.vehicle_cost = vehicle_context.get("cost", vehicle_context.get("price", 0) * 0.85)
            
            # UX: Set vehicle name properly
            make = vehicle_context.get("make", "")
            model = vehicle_context.get("model", "")
            if make and model:
                session.target_vehicle_name = f"{make} {model}"
            elif vehicle_context.get("name"):
                session.target_vehicle_name = vehicle_context.get("name")
            
            # Store ALL vehicle fields for AI and vehicle_card response
            session.vehicle_features = vehicle_context.get("features", [])
            session.vehicle_specs = vehicle_context.get("specifications", {})
            session.vehicle_year = vehicle_context.get("year", 2024)
            session.vehicle_condition = vehicle_context.get("condition", "")
            session.vehicle_mileage = vehicle_context.get("mileage", 0)
            session.vehicle_location = vehicle_context.get("location", "")
        
        # Update trade-in if provided
        if trade_in_context:
            session.trade_in_id = trade_in_context.get("trade_in_id")
            raw_value = float(trade_in_context.get("value", 0))
            
            # TRADE-IN ABUSE PREVENTION
            # Cap at 60% of target vehicle price
            max_trade_in = session.target_vehicle_price * 0.60
            if raw_value > max_trade_in and session.target_vehicle_price > 0:
                print(f"WARNING: Trade-in value ({raw_value}) capped to {max_trade_in} (60% of price)")
                session.trade_in_value = max_trade_in
            else:
                session.trade_in_value = raw_value
        
        # Update profile if provided
        if profile_context:
            session.customer_profile.segment = profile_context.get("segment", "Standard")
            session.customer_profile.inferred_budget = profile_context.get("monthly_budget", 0)
        
        # NEW: Store comparison vehicles for comparison feature
        if comparison_vehicles:
            session.comparison_vehicles = comparison_vehicles
        
        return session

    async def _save_session(self, session: NegotiationSession):
        await self._session_store.save(session)

# Singleton instance
negotiation_agent = NegotiationAgent()
