"""
Negotiation Agent with Emotional Intelligence
Handles customer negotiations with empathy and adaptive strategies
Supports: French (FR), English (EN), Arabic (AR), Darija (MA)
Implements human-like conversation phases: Greeting → Discovery → Recommendation → Presentation → Negotiation
"""
from datetime import datetime
from typing import Dict, Any, List, Optional
import asyncio
import json
import aiofiles
import re
from pathlib import Path

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from config.settings import settings
from schemas.models import (
    NegotiationRequestModel,
    NegotiationResponseModel,
    EmotionalContextModel,
    AgentStepModel
)
from schemas.types import EmotionType, NegotiationIntent, ConversationPhase
from agents.strategies import get_strategy_for_intent, NegotiationMove
from core.session_store import get_session_store, NegotiationSession
from core.metrics import WinWinCalculator

# Multi-language support for Morocco (French, Arabic, Darija, English)
LANGUAGE_PATTERNS = {
    "ar": re.compile(r'[\u0600-\u06FF]'),  # Arabic script
    "en": re.compile(r'\b(hello|hi|thanks|please|car|price|expensive|cheap|deal|ok|want|looking|need|family|budget)\b', re.I),
    "fr": re.compile(r'\b(bonjour|merci|voiture|prix|cher|moins|offre|accord|je veux|cherche|famille|budget)\b', re.I),
    "ma": re.compile(r'\b(wach|bghit|bzaf|safi|mezyan|wakha|dyal|tomobil|3afak|chhal|flouss|familiya)\b', re.I),  # Darija
}

# Patterns to detect customer needs and preferences
NEEDS_PATTERNS = {
    "family": re.compile(r'\b(famille|familiale|enfants|kids|family|children|عائلة|familiya|wlad)\b', re.I),
    "budget": re.compile(r'\b(budget|(\d+)\s*(k|K|000|dh|mad|درهم)|pas cher|رخيص|rkhis)\b', re.I),
    "suv": re.compile(r'\b(suv|4x4|grand|big|كبير|kbir)\b', re.I),
    "economic": re.compile(r'\b(économique|eco|consommation|fuel|بنزين|gasoil|diesel)\b', re.I),
    "sport": re.compile(r'\b(sport|sportive|rapide|fast|سريع|speed)\b', re.I),
    "new": re.compile(r'\b(neuf|neuve|new|جديد|jdid)\b', re.I),
    "used": re.compile(r'\b(occasion|used|مستعمل|msta3mal)\b', re.I),
}

LANGUAGE_PROMPTS = {
    "fr": "Réponds en français de manière professionnelle et chaleureuse.",
    "en": "Respond in English in a professional and warm manner.",
    "ar": "أجب باللغة العربية الفصحى بأسلوب مهني ودافئ.",
    "ma": "Jaweb b darija maghribiya, b ta9a professionnelle w 7nina.",
}

class NegotiationAgent:
    """Agent specializing in win-win negotiations with emotional intelligence"""
    
    def __init__(self):
        self.llm = ChatGroq(
            groq_api_key=settings.groq_api_key,
            model_name=settings.default_model,
            temperature=0.7,
            max_tokens=1024
        )
        self.agent_steps: List[AgentStepModel] = []
        self._inventory_cache = None
        self._session_store = get_session_store()
    
    def _detect_language(self, text: str) -> str:
        """Detect language from customer message (FR/EN/AR/MA)"""
        # Check for Arabic script first (highest priority)
        if LANGUAGE_PATTERNS["ar"].search(text):
            # Check for Darija-specific words within Arabic text
            if LANGUAGE_PATTERNS["ma"].search(text):
                return "ma"  # Moroccan Darija
            return "ar"  # Modern Standard Arabic
        
        # Check for Darija romanized (Arabizi)
        if LANGUAGE_PATTERNS["ma"].search(text):
            return "ma"
        
        # Count French vs English matches
        fr_matches = len(LANGUAGE_PATTERNS["fr"].findall(text))
        en_matches = len(LANGUAGE_PATTERNS["en"].findall(text))
        
        if fr_matches > en_matches:
            return "fr"
        elif en_matches > fr_matches:
            return "en"
        
        return "fr"  # Default to French for Morocco
    
    def _extract_customer_needs(self, message: str, session: 'NegotiationSession') -> Dict[str, Any]:
        """Extract customer needs and preferences from message"""
        needs = session.customer_needs.copy() if session.customer_needs else {}
        
        for need_type, pattern in NEEDS_PATTERNS.items():
            if pattern.search(message):
                needs[need_type] = True
        
        # Extract budget if mentioned
        budget_match = re.search(r'(\d+)\s*(k|K|000|dh|mad|درهم)?', message)
        if budget_match:
            amount = int(budget_match.group(1))
            multiplier = budget_match.group(2)
            if multiplier and multiplier.lower() in ['k', '000']:
                amount *= 1000
            if amount > 100:  # Likely a budget mention
                needs['stated_budget'] = amount
                # Determine if monthly or total
                if amount < 15000:  # Likely monthly
                    session.stated_budget = amount
                    session.budget_type = "monthly"
                else:  # Likely total price
                    session.stated_budget = amount
                    session.budget_type = "total"
        
        session.customer_needs = needs
        return needs
    
    def _determine_phase_transition(self, message: str, intent: NegotiationIntent, session: 'NegotiationSession') -> str:
        """Determine if conversation should transition to next phase (Hardened logic)"""
        current_phase = session.conversation_phase
        round_count = session.negotiation_round
        
        # Safety: On turn 1, ALWAYS start with greeting/discovery unless explicitly asking for price
        if round_count <= 1 and intent not in [NegotiationIntent.COUNTER_OFFER, NegotiationIntent.BUDGET_MENTION]:
            if any(w in message.lower() for w in ["bonjour", "salut", "hello", "salam"]):
                return "greeting"
            return "discovery"

        # Transition logic based on current state
        if current_phase == "greeting":
            if round_count >= 1:
                return "discovery"
            return "greeting"
        
        elif current_phase == "discovery":
            # Move to recommendation after enough info or 2 turns of discovery
            has_needs = len([k for k, v in session.customer_needs.items() if v]) >= 2
            if has_needs or round_count >= 3:
                return "recommendation"
            return "discovery"
        
        elif current_phase == "recommendation":
            # Move to presentation only if specific vehicle interest shown
            # Even if target_vehicle_id is set (pre-selected), don't present until recommended
            if intent == NegotiationIntent.VEHICLE_INTEREST or round_count >= 4:
                return "presentation"
            return "recommendation"
        
        elif current_phase == "presentation":
            # Move to negotiation when price discussion starts
            if intent in [NegotiationIntent.COUNTER_OFFER, NegotiationIntent.BUDGET_MENTION]:
                return "negotiation"
            return "presentation"
        
        elif current_phase == "negotiation":
            if intent in [NegotiationIntent.ACCEPT, NegotiationIntent.REJECT]:
                return "closing"
            return "negotiation"
        
        return current_phase
    
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
    
    async def _get_or_create_session(
        self, 
        session_id: str, 
        customer_id: str = "unknown",
        vehicle_context: dict = None,
        trade_in_context: dict = None,
        profile_context: dict = None
    ) -> NegotiationSession:
        """Get existing session or create new one with optional context initialization"""
        session = await self._session_store.get(session_id)
        
        if not session:
            session = NegotiationSession(
                session_id=session_id,
                customer_id=customer_id
            )
            
            # Initialize from orchestrator context if provided (first turn)
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

            
            if trade_in_context:
                session.trade_in_id = trade_in_context.get("trade_in_id")
                session.trade_in_value = trade_in_context.get("value", 0)
            
            if profile_context:
                session.customer_profile.segment = profile_context.get("segment", "Unknown")
                session.customer_profile.price_sensitivity = profile_context.get("price_sensitivity", "Medium")
                session.customer_profile.priorities = profile_context.get("priorities", [])
                session.customer_profile.communication_style = profile_context.get("communication_style", "Professional")
                session.customer_profile.inferred_budget = profile_context.get("monthly_budget", 0)
                session.customer_profile.confidence = profile_context.get("confidence_score", 0.5)
            
            await self._save_session(session)
        
        return session
    
    async def _save_session(self, session: NegotiationSession):
        """Save session state"""
        await self._session_store.save(session)
    
    async def _analyze_emotion(self, message: str) -> EmotionalContextModel:
        """
        Detect customer emotion from message using LLM with robust parsing
        """
        prompt = ChatPromptTemplate.from_template(
            """Tu es un expert en analyse émotionnelle des conversations commerciales.
            
            Message client: "{message}"
            
            Tâche:
            1. Identifie l'émotion dominante parmi: neutral, frustrated, happy, worried, budget_stressed, satisfied, excited, confused
            2. Détermine l'intensité (0.0 à 1.0).
            3. Identifie les préoccupations cachées.
            
            IMPORTANT: Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après:
            {{
              "emotion": "une des valeurs: neutral|frustrated|happy|worried|budget_stressed|satisfied|excited|confused",
              "intensity": 0.5,
              "sentiment": 0.0,
              "concerns": ["liste des préoccupations"],
              "tone": "ton recommandé",
              "strategy": "stratégie recommandée"
            }}
            """
        )
        
        max_retries = 2
        last_error = None
        
        for attempt in range(max_retries):
            try:
                chain = prompt | self.llm
                response_content = await chain.ainvoke({"message": message})
                content = response_content.content.strip()
                
                # Extract JSON from potential markdown blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                elif "{" in content:
                    start = content.find("{")
                    end = content.rfind("}") + 1
                    content = content[start:end]
                
                data = json.loads(content)
                
                # Map emotion string to Enum with comprehensive matching
                emotion_str = data.get("emotion", "neutral").lower().replace(" ", "_").replace("-", "_")
                
                emotion_mapping = {
                    "neutral": EmotionType.NEUTRAL,
                    "frustrated": EmotionType.FRUSTRATED,
                    "frustration": EmotionType.FRUSTRATED,
                    "colère": EmotionType.FRUSTRATED,
                    "colere": EmotionType.FRUSTRATED,
                    "angry": EmotionType.FRUSTRATED,
                    "happy": EmotionType.HAPPY,
                    "joie": EmotionType.HAPPY,
                    "satisfied": EmotionType.SATISFIED,
                    "satisfait": EmotionType.SATISFIED,
                    "worried": EmotionType.WORRIED,
                    "inquiet": EmotionType.WORRIED,
                    "anxious": EmotionType.WORRIED,
                    "budget_stressed": EmotionType.BUDGET_STRESSED,
                    "stressed": EmotionType.BUDGET_STRESSED,
                    "excited": EmotionType.EXCITED,
                    "enthousiaste": EmotionType.EXCITED,
                    "confused": EmotionType.CONFUSED,
                    "confus": EmotionType.CONFUSED,
                    "hésitant": EmotionType.CONFUSED,
                    "hesitant": EmotionType.CONFUSED,
                }
                
                emotion = emotion_mapping.get(emotion_str, EmotionType.NEUTRAL)
                
                # Validate numeric fields
                intensity = float(data.get("intensity", 0.5))
                intensity = max(0.0, min(1.0, intensity))
                
                sentiment = float(data.get("sentiment", 0.0))
                sentiment = max(-1.0, min(1.0, sentiment))
                
                concerns = data.get("concerns", [])
                if not isinstance(concerns, list):
                    concerns = [str(concerns)] if concerns else []
    
                return EmotionalContextModel(
                    primary_emotion=emotion,
                    intensity=intensity,
                    sentiment_score=sentiment,
                    key_concerns=concerns,
                    recommended_tone=str(data.get("tone", "professional")),
                    recommended_strategy=str(data.get("strategy", "listen"))
                )
                
            except json.JSONDecodeError as e:
                last_error = e
                print(f"Emotion Analysis JSON Parse Failed (attempt {attempt + 1}): {e}")
                continue
            except Exception as e:
                last_error = e
                print(f"Emotion Analysis Failed (attempt {attempt + 1}): {e}")
                break
        
        print(f"Emotion Analysis Failed after retries: {last_error}, using fallback.")
        return EmotionalContextModel(
            primary_emotion=EmotionType.NEUTRAL,
            intensity=0.0,
            sentiment_score=0.0,
            key_concerns=[],
            recommended_tone="professional",
            recommended_strategy="inquire"
        )

    def _detect_intent(self, message: str, session: 'NegotiationSession' = None) -> NegotiationIntent:
        """Classify customer intent with phase awareness (Enhanced multi-language)"""
        message_lower = message.lower()
        current_phase = session.conversation_phase if session else "greeting"
        
        # GREETING PHASE: Check for greetings first
        greeting_phrases = [
            # French
            "bonjour", "salut", "bonsoir", "coucou", "hello",
            # English  
            "hi", "hello", "hey", "good morning", "good evening",
            # Arabic/Darija
            "salam", "mrhba", "ahlan", "labas"
        ]
        if current_phase == "greeting" and any(phrase in message_lower for phrase in greeting_phrases):
            return NegotiationIntent.GREETING
        
        # INQUIRY: Customer asking about cars in general
        inquiry_phrases = [
            # French
            "je cherche", "vous avez", "qu'est-ce que", "quels", "quel type",
            "montrez", "voir", "disponible",
            # English
            "looking for", "do you have", "what kind", "show me", "available",
            "i want", "i need", "interested in",
            # Darija
            "bghit", "3ndkom", "wach kayn", "werini", "chnou"
        ]
        if any(phrase in message_lower for phrase in inquiry_phrases):
            return NegotiationIntent.INQUIRY
        
        # BUDGET MENTION: Customer stating their budget
        budget_phrases = [
            "budget", "moins de", "maximum", "jusqu'à", "up to",
            "can spend", "afford", "monthly", "par mois", "f chhar"
        ]
        if any(phrase in message_lower for phrase in budget_phrases):
            return NegotiationIntent.BUDGET_MENTION
        
        # VEHICLE INTEREST: Interest in specific vehicle
        vehicle_interest_phrases = [
            # French
            "celle-ci", "celui-là", "ce modèle", "cette voiture", 
            "je veux voir", "plus de détails", "intéressé par",
            # English
            "this one", "that one", "this model", "tell me more", "interested in this",
            # Darija
            "hadi", "hadik", "bghit hadi"
        ]
        if any(phrase in message_lower for phrase in vehicle_interest_phrases):
            return NegotiationIntent.VEHICLE_INTEREST
        
        # Only check price negotiation if we're past discovery phase
        if current_phase in ["presentation", "negotiation"]:
            # COUNTER-OFFER: Price negotiation
            counter_phrases = [
                # French
                "trop cher", "réduction", "rabais", "dernier prix",
                "effort", "moins cher", "baisser", "négocier",
                "meilleur prix", "remise", "promotion",
                # English
                "expensive", "too much", "lower", "cheaper", "discount",
                "better price", "best price", "reduce", "can't pay", "negotiate",
                "better deal",
                # Arabic/Darija
                "ghali", "bzaf", "n9es", "rkhis"
            ]
            if any(phrase in message_lower for phrase in counter_phrases):
                return NegotiationIntent.COUNTER_OFFER
        
        # Check for acceptance (only in negotiation phase)
        if current_phase == "negotiation":
            accept_phrases = [
                # French - more specific phrases
                "d'accord", "je prends", "ça marche", "marché conclu",
                "j'accepte", "on fait comme ça", "c'est bon je prends", "je signe",
                "allons-y", "vendu", "je l'achète", "ok parfait",
                # English - specific acceptance
                "i'll take it", "i accept", "we have a deal", "sounds good",
                "let's do it", "i'm in", "that works", "you got a deal",
                # Arabic/Darija
                "wakha", "safi", "mwafeq", "ana mwafeq"
            ]
            if any(phrase in message_lower for phrase in accept_phrases):
                return NegotiationIntent.ACCEPT
        
        # Check for rejection (any phase)
        reject_phrases = [
            # French
            "non merci", "pas intéressé", "trop pour moi", "je refuse",
            "impossible", "je ne peux pas", "laissez tomber", "au revoir",
            # English
            "no thanks", "not interested", "forget it", "no way", "goodbye",
            # Arabic/Darija
            "la shukran", "makanch"
        ]
        if any(phrase in message_lower for phrase in reject_phrases):
            return NegotiationIntent.REJECT
        
        # Check for alternative request
        if any(w in message_lower for w in ["autre", "alternative", "différent", "other"]):
            return NegotiationIntent.REQUEST_ALTERNATIVE
        
        return NegotiationIntent.REQUEST_INFO

    async def _find_matching_vehicles(self, session: 'NegotiationSession', limit: int = 3) -> List[Dict[str, Any]]:
        """Find vehicles matching customer needs and budget"""
        inventory = await self._load_inventory()
        needs = session.customer_needs or {}
        budget = session.stated_budget
        budget_type = session.budget_type
        
        # Convert budget to total price range
        if budget and budget_type == "monthly":
            max_price = budget * 60 * 1.1  # 60 months + 10% buffer
            min_price = budget * 60 * 0.5  # At least affordable
        elif budget:
            max_price = budget * 1.1
            min_price = budget * 0.5
        else:
            max_price = float('inf')
            min_price = 0
        
        matches = []
        for car in inventory:
            car_price = car.get('price', 0)
            score = 0
            
            # Price filter
            if min_price <= car_price <= max_price:
                score += 30
            elif car_price <= max_price * 1.2:  # Slightly over budget
                score += 10
            else:
                continue  # Skip if way over budget
            
            # Family need
            if needs.get('family'):
                if car.get('seats', 5) >= 5 or 'family' in car.get('category', '').lower():
                    score += 20
                if car.get('make', '').lower() in ['dacia', 'renault', 'peugeot']:
                    score += 10
            
            # SUV preference
            if needs.get('suv'):
                if 'suv' in car.get('category', '').lower() or '4x4' in car.get('model', '').lower():
                    score += 25
            
            # Economic preference
            if needs.get('economic'):
                if car.get('fuelType', '').lower() in ['diesel', 'hybrid', 'electric']:
                    score += 20
            
            # Sport preference
            if needs.get('sport'):
                if 'sport' in car.get('model', '').lower() or car.get('horsePower', 0) > 150:
                    score += 25
            
            # New vs Used
            if needs.get('new') and car.get('condition', '').lower() == 'new':
                score += 15
            if needs.get('used') and car.get('condition', '').lower() == 'used':
                score += 15
            
            if score > 0:
                matches.append({
                    "vehicle_id": str(car.get('_id') or car.get('id') or car.get('vin', '')),
                    "make": car.get('make', ''),
                    "model": car.get('model', ''),
                    "year": car.get('year', 2024),
                    "price": car_price,
                    "monthly_estimate": round(car_price * 1.05 / 60, -1),
                    "color": car.get('color', ''),
                    "mileage": car.get('mileage', 0),
                    "condition": car.get('condition', 'used'),
                    "features": car.get('features', [])[:3],  # Top 3 features
                    "match_score": score
                })
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return matches[:limit]

    async def _find_alternative_vehicles(self, current_price: float, customer_budget: float) -> list:
        """Find cheaper alternatives when customer can't afford current vehicle"""
        inventory = await self._load_inventory()
        
        # Target vehicles at 80-100% of customer's stated budget
        target_max = customer_budget * 60 * 1.1  # Monthly * 60 months * 10% buffer
        target_min = customer_budget * 60 * 0.6  # At least 60% of budget
        
        alternatives = []
        for car in inventory:
            car_price = car.get('price', 0)
            if target_min <= car_price <= target_max and car_price < current_price:
                alternatives.append({
                    "vehicle_id": str(car.get('_id') or car.get('id') or car.get('vin')),
                    "make": car.get('make'),
                    "model": car.get('model'),
                    "year": car.get('year'),
                    "price": car_price,
                    "estimated_monthly": round(car_price * 1.05 / 60, -1),  # Rough estimate
                    "reason": f"Dans votre budget - {car.get('make')} {car.get('model')}"
                })
        
        # Sort by price and return top 3
        alternatives.sort(key=lambda x: x['price'])
        return alternatives[:3]

    async def _load_inventory(self):
        """Non-blocking Async inventory load"""
        if self._inventory_cache:
            return self._inventory_cache
            
        try:
            path = Path(__file__).parent.parent / "data" / "inventory.json"
            async with aiofiles.open(path, mode='r', encoding='utf-8') as f:
                content = await f.read()
                self._inventory_cache = json.loads(content)
                return self._inventory_cache
        except Exception as e:
            print(f"Inventory load error: {e}")
            return []

    async def _get_vehicle_cost(self, vehicle_id: str) -> float:
        inventory = await self._load_inventory()
        for car in inventory:
            if str(car.get('id', '')) == str(vehicle_id) or str(car.get('_id', '')) == str(vehicle_id):
                # Cost is usually hidden; assume 15% margin for demo if not set
                price = car.get('price', 0)
                return car.get('costPrice', price * 0.85)
        return 0.0

    async def _calculate_smart_concession(
        self, 
        current_offer: Dict[str, Any], 
        intent: NegotiationIntent,
        emotion: EmotionalContextModel,
        history_len: int,
        session: 'NegotiationSession' = None
    ) -> tuple[Optional[Dict[str, Any]], str]:
        """
        Uses Strategy Pattern to calculate move with robust floor price logic.
        Ensures dealer never goes below minimum margin.
        CRITICAL: Offers can only go DOWN during negotiation, never up.
        """
        vehicle_id = current_offer.get("vehicle_id") or (session.target_vehicle_id if session else None)
        current_monthly = current_offer.get("monthly", 0)
        duration = current_offer.get("duration", 60)
        trade_in_value = current_offer.get("trade_in_value", 0) or (session.trade_in_value if session else 0)
        vehicle_price = current_offer.get("vehicle_price", 0) or (session.target_vehicle_price if session else 0)
        
        # 1. Get Cost Floor with validation - prioritize session data
        cost_price = 0.0
        if session and session.vehicle_cost > 0:
            cost_price = session.vehicle_cost
        elif vehicle_id:
            cost_price = await self._get_vehicle_cost(vehicle_id)
        
        # Debug logging (uncomment for troubleshooting)
        # print(f"[CONCESSION DEBUG] current_monthly={current_monthly}, vehicle_price={vehicle_price}, cost_price={cost_price}")
        
        # 2. Calculate floor (minimum acceptable monthly payment)
        if cost_price > 0:
            # Have real cost data - use 5% minimum margin on cost
            min_selling_price = cost_price * 1.05
        elif vehicle_price > 0:
            # Have vehicle price but no cost - assume 15% margin built in, allow 10% discount
            min_selling_price = vehicle_price * 0.90
        else:
            # No vehicle data - use 70% of current offer as absolute floor (allows 30% negotiation room)
            min_selling_price = current_monthly * duration * 0.70 if current_monthly > 0 else 150000
        
        # Subtract trade-in from amount to finance
        financed_amount = max(min_selling_price - trade_in_value, min_selling_price * 0.5)
        
        # Calculate monthly floor (simple interest ~5% APR spread over term)
        interest_factor = 1 + (0.05 * (duration / 12))
        min_monthly_floor = (financed_amount * interest_factor) / duration if duration > 0 else 2500
        min_monthly_floor = max(min_monthly_floor, 500)  # Absolute minimum
        
        # print(f"[CONCESSION DEBUG] min_selling_price={min_selling_price}, min_monthly_floor={min_monthly_floor}")
        
        # 3. Calculate STARTING offer if this is first turn (no current_monthly)
        if current_monthly <= 0:
            # Start at 15% above floor for negotiation room
            starting_monthly = min_monthly_floor * 1.15
            starting_monthly = round(starting_monthly, -1)  # Round to nearest 10
            
            return {
                "monthly": starting_monthly,
                "duration": duration,
                "vehicle_id": vehicle_id,
                "vehicle_price": vehicle_price,
                "trade_in_value": trade_in_value
            }, f"Offre initiale basée sur le véhicule sélectionné. Marge de négociation disponible."
        
        # 4. Determine aggression based on emotion and history
        aggression = 0.15  # Default: small concessions (15% of remaining margin)
        
        if emotion.primary_emotion in [EmotionType.FRUSTRATED, EmotionType.BUDGET_STRESSED]:
            aggression = 0.35  # More generous when customer is stressed
        if emotion.primary_emotion == EmotionType.HAPPY:
            aggression = 0.05  # Hold firm when customer is happy
        
        # Increase aggression as negotiation drags on
        if history_len >= 3:
            aggression = min(0.50, aggression + 0.15)
        if history_len >= 5:
            aggression = min(0.70, aggression + 0.20)
        
        # 5. Calculate concession amount
        margin_available = current_monthly - min_monthly_floor
        
        if margin_available <= 0:
            # Already at or below floor - suggest alternatives or hold firm
            return {
                "monthly": current_monthly,
                "duration": duration,
                "vehicle_id": vehicle_id,
                "vehicle_price": vehicle_price,
                "trade_in_value": trade_in_value,
                "at_floor": True,
                "suggest_alternatives": True
            }, "Prix plancher atteint. Nous pouvons explorer d'autres véhicules dans votre budget ou ajuster la durée du financement."
        
        concession = margin_available * aggression
        concession = max(50, concession)  # Minimum 50 MAD concession if any
        
        new_monthly = current_monthly - concession
        
        # CRITICAL: Never go below floor, never go UP
        new_monthly = max(min_monthly_floor, new_monthly)
        new_monthly = min(current_monthly, new_monthly)  # Never increase!
        new_monthly = round(new_monthly, -1)  # Round to nearest 10
        
        # Check if at floor
        at_floor = (current_monthly - new_monthly) < 100 or new_monthly <= min_monthly_floor + 50
        
        new_offer = {
            "monthly": new_monthly,
            "duration": duration,
            "vehicle_id": vehicle_id,
            "vehicle_price": vehicle_price,
            "trade_in_value": trade_in_value
        }
        
        # 6. Generate reasoning
        if at_floor:
            reasoning = f"Offre plancher atteinte. Réduction de {int(current_monthly - new_monthly)} MAD - c'est notre meilleur prix."
        else:
            reasoning = f"Concession de {int(current_monthly - new_monthly)} MAD accordée (stratégie: {emotion.recommended_strategy})."
        
        return new_offer, reasoning

    async def negotiate(self, request: NegotiationRequestModel) -> NegotiationResponseModel:
        self.agent_steps = []
        
        # 0. Load or create session with context from orchestrator (if first turn)
        session = await self._get_or_create_session(
            session_id=request.session_id, 
            customer_id=request.customer_id or "unknown",
            vehicle_context=request.vehicle_context,
            trade_in_context=request.trade_in_context,
            profile_context=request.profile_context
        )
        
        # 1. Emotion (Async) with trend tracking
        emotional_context = await self._analyze_emotion(request.customer_message)
        
        # Track emotion in session for trend analysis
        emotion_score = self._emotion_to_score(emotional_context.primary_emotion)
        session.emotional_trend.add_reading(
            emotion=emotional_context.primary_emotion,
            intensity=emotional_context.intensity,
            sentiment=emotion_score,
            message=request.customer_message
        )
        
        self._log_step(
            "Analyse Émotionnelle", 
            f"Detected {emotional_context.primary_emotion} ({emotional_context.intensity}) | Trend: {session.emotional_trend.get_trend()}", 
            {**emotional_context.dict(), "trend": session.emotional_trend.get_trend()}, 
            0.85
        )
        
        # Add customer message to session history
        session.add_message("customer", request.customer_message, emotional_context.primary_emotion)

        # 2. Language Detection (early - used in all responses)
        detected_language = self._detect_language(request.customer_message)

        # 3. Intent Detection
        intent = self._detect_intent(request.customer_message)
        
        # 3.5 Handle ACCEPT intent - finalize the deal
        if intent == NegotiationIntent.ACCEPT:
            session.status = "accepted"
            await self._save_session(session)
            
            self._log_step("Deal Accepté", "Le client a accepté l'offre!", {"final_offer": request.current_offer, "language": detected_language}, 0.95)
            
            response_text = await self._generate_acceptance_response(session, language=detected_language)
            
            emotional_trend_data = session.emotional_trend.get_trend()
            return NegotiationResponseModel(
                session_id=request.session_id,
                agent_message=response_text,
                detected_language=detected_language,
                emotional_analysis=emotional_context,
                intent_detected=intent,
                new_offer=request.current_offer,
                alternatives=[],
                reasoning="Client a accepté l'offre. Deal conclu!",
                confidence=0.95,
                agent_steps=self.agent_steps,
                should_finalize=True,
                emotional_trend="positive",
                emotional_trend_details=emotional_trend_data if isinstance(emotional_trend_data, dict) else None,
                win_win_score=session.win_win_score or 75.0,
                negotiation_round=session.negotiation_round,
                session_summary=session.get_summary()
            )
        
        # 3.6 Handle REJECT intent
        if intent == NegotiationIntent.REJECT:
            session.status = "rejected"
            await self._save_session(session)
            
            self._log_step("Deal Rejeté", "Le client a refusé l'offre", {"language": detected_language}, 0.9)
            
            # Multi-language rejection responses
            reject_responses = {
                "fr": "Je comprends votre décision. N'hésitez pas à revenir si vous changez d'avis, nous serons là pour vous aider.",
                "en": "I understand your decision. Feel free to come back if you change your mind, we'll be here to help.",
                "ar": "أتفهم قرارك. لا تتردد في العودة إذا غيرت رأيك، سنكون هنا لمساعدتك.",
                "ma": "Fhemt, makynch mochkil. Ila bdelti ra2yek, mrhba bik!"
            }
            response_text = reject_responses.get(detected_language, reject_responses["fr"])
            
            emotional_trend_data = session.emotional_trend.get_trend()
            return NegotiationResponseModel(
                session_id=request.session_id,
                agent_message=response_text,
                detected_language=detected_language,
                emotional_analysis=emotional_context,
                intent_detected=intent,
                new_offer=None,
                alternatives=[],
                reasoning="Client a refusé l'offre.",
                confidence=0.9,
                agent_steps=self.agent_steps,
                should_finalize=True,
                emotional_trend="negative",
                emotional_trend_details=emotional_trend_data if isinstance(emotional_trend_data, dict) else None,
                win_win_score=0,
                negotiation_round=session.negotiation_round,
                session_summary=session.get_summary()
            )
        
        # 3.8 Determine phase transition
        session.conversation_phase = self._determine_phase_transition(request.customer_message, intent, session)
        
        # 4. Smart Concession - pass session for context
        # Only calculate concession if we are in presentation/negotiation phase
        current_offer = request.current_offer or {}
        new_offer = None
        reasoning = "Discussion sur les besoins et préférences"
        
        if session.conversation_phase in ["presentation", "negotiation"]:
            new_offer, reasoning = await self._calculate_smart_concession(
                current_offer, 
                intent, 
                emotional_context,
                session.negotiation_round,
                session  # Pass session for vehicle/trade-in context
            )
        
        # 3.9 Find alternatives if at floor and customer still pushing
        alternatives = []
        if new_offer and new_offer.get("suggest_alternatives"):
            customer_budget = session.customer_profile.inferred_budget or current_offer.get("monthly", 5000) * 0.8
            alternatives = await self._find_alternative_vehicles(
                current_price=session.target_vehicle_price or current_offer.get("vehicle_price", 0),
                customer_budget=customer_budget
            )
            if alternatives:
                self._log_step(
                    "Alternatives Trouvées", 
                    f"Proposé {len(alternatives)} véhicules alternatifs dans le budget du client",
                    {"alternatives": alternatives},
                    0.85
                )
        
        self._log_step("Stratégie de Négociation", reasoning, {"new_offer": new_offer, "phase": session.conversation_phase}, 0.9)

        # Log detected language (already detected earlier)
        self._log_step("Langue Détectée", f"Client parle en {detected_language.upper()}", {"language": detected_language}, 0.9)

        # 5. Response Generation (in customer's language)
        response_text = await self._generate_response(
            request.customer_message, 
            emotional_context, 
            new_offer, 
            current_offer, 
            reasoning,
            language=detected_language,
            session=session
        )
        
        # 6. Record offer in session if new offer made
        if new_offer:
            session.record_offer(
                monthly=new_offer.get("monthly", 0),
                duration=new_offer.get("duration", 60),
                down_payment=new_offer.get("down_payment", 0),
                concession_reason=reasoning
            )
        
        # Add agent response to session history
        session.add_message("agent", response_text)
        
        # 6. Calculate win-win score for this turn
        if new_offer:
            # Get vehicle cost from session or estimate
            vehicle_cost = session.vehicle_cost if session.vehicle_cost > 0 else (
                current_offer.get("vehicle_price", 0) * 0.85
            )
            trade_in_value = session.trade_in_value or current_offer.get("trade_in_value", 0)
            customer_budget = session.customer_profile.inferred_budget or new_offer.get("monthly", 3000) * 1.2
            
            # Use the correct class method
            win_win_result = WinWinCalculator.estimate_from_monthly(
                monthly_payment=new_offer.get("monthly", 3000),
                duration_months=new_offer.get("duration", 60),
                vehicle_cost=vehicle_cost if vehicle_cost > 0 else new_offer.get("monthly", 3000) * 50,
                trade_in_value=trade_in_value,
                customer_budget=customer_budget,
                customer_emotion_score=session.emotional_trend.get_average_sentiment()
            )
            session.win_win_score = win_win_result.get("win_win_score", 0)
        
        # 7. Save session state
        await self._save_session(session)
        
        # Get emotional trend data for response
        emotional_trend_data = session.emotional_trend.get_trend()
        trend_direction = emotional_trend_data.get("direction", "stable") if isinstance(emotional_trend_data, dict) else "stable"
        
        return NegotiationResponseModel(
            session_id=request.session_id,
            agent_message=response_text,
            detected_language=detected_language,
            emotional_analysis=emotional_context,
            intent_detected=intent,
            new_offer=new_offer,
            alternatives=alternatives,  # Include alternative vehicles
            reasoning=reasoning,
            confidence=0.9,
            agent_steps=self.agent_steps,
            should_finalize=(intent == NegotiationIntent.ACCEPT),
            emotional_trend=trend_direction,
            emotional_trend_details=emotional_trend_data if isinstance(emotional_trend_data, dict) else None,
            win_win_score=session.win_win_score or 0.0,
            negotiation_round=session.negotiation_round,
            session_summary=session.get_summary() if intent == NegotiationIntent.ACCEPT else None
        )
    
    async def _generate_acceptance_response(self, session: 'NegotiationSession', language: str = "fr") -> str:
        """Generate a warm acceptance/congratulations response in customer's language"""
        language_instruction = LANGUAGE_PROMPTS.get(language, LANGUAGE_PROMPTS["fr"])
        language_name = {"fr": "français", "en": "English", "ar": "العربية", "ma": "darija"}.get(language, "français")
        
        # Get car details for personalization
        car_info = f"{session.target_vehicle_id}"
        if session.target_vehicle_price > 0:
            car_info = f"votre nouveau véhicule"
            
        # Fallback messages per language
        fallbacks = {
            "fr": f"Félicitations pour votre choix! Votre mensualité sera de {session.current_monthly} MAD/mois. Notre équipe vous contactera sous peu pour finaliser les documents.",
            "en": f"Congratulations on your choice! Your monthly payment will be {session.current_monthly} MAD/month. Our team will contact you soon to finalize the paperwork.",
            "ar": f"تهانينا على اختيارك! القسط الشهري سيكون {session.current_monthly} درهم/شهر. سيتصل بك فريقنا قريباً لإتمام الإجراءات.",
            "ma": f"Mabrouk 3lik! Ghadi tkhlles {session.current_monthly} MAD/chhar. L'équipe dyalna ghadi t3aytlek bach nkamlo l papiers."
        }
        
        prompt = ChatPromptTemplate.from_template(
            """You are an expert car negotiator who just closed a successful sale for {car_info}.
            
            Deal details:
            - Final monthly payment: {monthly} MAD/month
            - Duration: {duration} months
            
            Generate a warm and professional congratulations message (2-3 sentences) that:
            1. Congratulates the customer on their excellent choice of {car_info}
            2. Briefly outlines next steps
            3. Expresses your satisfaction in helping them
            
            IMPORTANT: Respond ONLY in {language_name}. {language_instruction}"""
        )
        
        try:
            chain = prompt | self.llm
            result = await chain.ainvoke({
                "monthly": session.current_monthly,
                "duration": session.current_duration,
                "car_info": car_info,
                "language_name": language_name,
                "language_instruction": language_instruction
            })
            return result.content
        except Exception as e:
            return fallbacks.get(language, fallbacks["fr"])
    
    def _emotion_to_score(self, emotion) -> float:
        """Convert emotion (Enum or string) to numeric score for trend tracking."""
        # Handle both EmotionType enum and string
        emotion_str = emotion.value if hasattr(emotion, 'value') else str(emotion)
        emotion_lower = emotion_str.lower()
        
        emotion_scores = {
            # EmotionType enum values
            "neutral": 0.5,
            "happy": 0.8,
            "frustrated": 0.2,
            "excited": 0.9,
            "worried": 0.35,
            "budget_stressed": 0.25,
            "confused": 0.4,
            "satisfied": 0.85,
            # French variants
            "très_positif": 1.0,
            "positif": 0.75,
            "neutre": 0.5,
            "négatif": 0.25,
            "très_négatif": 0.0,
            "frustré": 0.2,
            "hésitant": 0.4,
            "intéressé": 0.7,
            "enthousiaste": 0.9,
            "confiant": 0.8,
            "sceptique": 0.35,
            "impatient": 0.3,
        }
        return emotion_scores.get(emotion_lower, 0.5)

    async def _generate_response(
        self, 
        customer_msg: str, 
        emotion: EmotionalContextModel, 
        new_offer: Optional[Dict[str, Any]], 
        current_offer: Optional[Dict[str, Any]], 
        reasoning: str, 
        language: str = "fr",
        session: 'NegotiationSession' = None
    ) -> str:
        """Generate phase-aware response in customer's detected language"""
        phase = session.conversation_phase if session else "greeting"
        language_instruction = LANGUAGE_PROMPTS.get(language, LANGUAGE_PROMPTS["fr"])
        language_name = {"fr": "Français", "en": "English", "ar": "العربية", "ma": "Darija Marocaine"}.get(language, "Français")

        # Get session context for rapport
        car_name = session.target_vehicle_name if session and session.target_vehicle_name else (
             session.target_vehicle_id if session and session.target_vehicle_id else "ce véhicule"
        )
        needs = ", ".join([k for k, v in session.customer_needs.items() if v]) if session and session.customer_needs else "besoins automobiles"

        # Phase-specific offer text - PROTECT PRICE FROM EARLY PHASES
        if phase in ["presentation", "negotiation"] and new_offer:
            offer_text = f"Nouvelle offre: {new_offer.get('monthly', 0)} MAD/mois pour {new_offer.get('duration', 60)} mois."
        else:
            # EMPTY offer text for early phases to prevent LLM from mentioning it
            offer_text = "[AUCUNE OFFRE DE PRIX - NE PAS PARLER DE CHIFFRES]"

        # Template selection based on phase with stricter constraints
        templates = {
            "greeting": f"""Tu es un conseiller commercial expert chez un concessionnaire automobile au Maroc.
                Message: "{{msg}}"
                Contexte Véhicule: {car_name}
                CONSIGNE: Sois accueillant et chaleureux. Ne parle PAS de prix ou d'offres. Remercie le client et demande comment tu peux l'aider aujourd'hui concernant la {car_name}.
                Réponds en {language_name}. {language_instruction}""",
                
            "discovery": f"""Tu es un conseiller automobile à l'écoute.
                Message: "{{msg}}" | Besoins: {needs}
                Contexte Véhicule: {car_name}
                CONSIGNE: Phase d'écoute. Mentionne la {car_name} pour montrer que tu as compris. Pose des questions sur ses besoins: usage (travail/famille), préférences (SUV/Eco), budget mensuel souhaité. Ne donne PAS de prix.
                Réponds en {language_name}. {language_instruction}""",
                
            "recommendation": f"""Tu es un expert produit. 
                Message: "{{msg}}"
                Contexte Véhicule: {car_name}
                CONSIGNE: Parle avec passion de la {car_name}. Explique ses avantages par rapport aux besoins: {needs}. Ne parle PAS encore de mensualités ou de remise.
                Réponds en {language_name}. {language_instruction}""",
                
            "presentation": f"""Tu es un conseiller présentant une solution de financement pour la {car_name}.
                Message: "{{msg}}" | Offre: {{offer_text}}
                CONSIGNE: Présente l'offre {{offer_text}} de manière claire et professionnelle. Explique que c'est une option calculée pour lui sur la {car_name}.
                Réponds en {language_name}. {language_instruction}""",
                
            "negotiation": f"""Tu es un négociateur expert et empathique pour la {car_name}.
                Message: "{{msg}}" | Émotion: {{tone}} | Offre: {{offer_text}}
                CONSIGNE: Phase de négociation active pour la {car_name}. Utilise la stratégie: {{reasoning}}. Montre au client que tu fais un geste commercial significatif.
                Réponds en {language_name}. {language_instruction}"""
        }

        template = templates.get(phase, templates["negotiation"])
        prompt = ChatPromptTemplate.from_template(template)
        
        try:
            chain = prompt | self.llm
            res = await chain.ainvoke({
                "msg": customer_msg,
                "language_name": language_name,
                "language_instruction": language_instruction,
                "offer_text": offer_text,
                "tone": emotion.recommended_tone,
                "reasoning": reasoning
            })
            
            # Final safety check: if LLM still hallucinated a price in early phases, strip it
            content = res.content
            if phase in ["greeting", "discovery", "recommendation"]:
                content = self._strip_price_mentions(content)
            
            return content
        except Exception as e:
            return f"Je comprends. Puis-je vous aider à trouver le modèle qui correspond le mieux à vos besoins ?"
    
    def _strip_price_mentions(self, text: str) -> str:
        """
        Remove price mentions from text to prevent premature price discussion.
        Used as a safety net when LLM ignores phase constraints.
        """
        import re
        
        # Patterns to detect and remove price mentions
        price_patterns = [
            # MAD amounts: "3500 MAD", "3,500 MAD", "3 500 MAD"
            r'\b\d[\d\s,\.]*\s*MAD\b',
            r'\b\d[\d\s,\.]*\s*mad\b',
            # Dirham in Arabic: "3500 درهم"
            r'\b\d[\d\s,\.]*\s*درهم\b',
            # Monthly payment patterns in French
            r'\b\d[\d\s,\.]*\s*(?:MAD|DH|درهم)\s*/\s*mois\b',
            r'\bmensualité\s+de\s+\d[\d\s,\.]*\s*(?:MAD|DH|درهم)?\b',
            r'\bpaiement\s+mensuel\s+de\s+\d[\d\s,\.]*\b',
            # Price patterns in English
            r'\bmonthly\s+payment\s+of\s+\d[\d\s,\.]*\b',
            r'\b\d[\d\s,\.]*\s*per\s*month\b',
            # Offer patterns
            r'\boffre\s+de\s+\d[\d\s,\.]*\b',
            r'\bprix\s+de\s+\d[\d\s,\.]*\b',
            # Percentage discounts with amounts
            r'\bréduction\s+de\s+\d[\d\s,\.]*\s*(?:MAD|DH|درهم|%)?\b',
        ]
        
        modified = text
        for pattern in price_patterns:
            modified = re.sub(pattern, '[prix à discuter]', modified, flags=re.IGNORECASE)
        
        # If we made replacements, also clean up awkward phrasing
        if modified != text:
            # Remove duplicate placeholders
            modified = re.sub(r'(\[prix à discuter\]\s*)+', '[prix à discuter] ', modified)
            # Clean up punctuation around placeholders
            modified = re.sub(r'\s+([.,!?])', r'\1', modified)
        
        return modified.strip()

negotiation_agent = NegotiationAgent()
