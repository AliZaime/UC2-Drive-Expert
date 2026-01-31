from typing import Dict, Any, List, Optional
import re
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from schemas.models import EmotionalContextModel
from schemas.types import EmotionType, NegotiationIntent
from core.logger import logger

class AnalysisService:
    """Handles LLM-based understanding (Emotion, Intent, Needs)"""

    def __init__(self, llm):
        self.llm = llm
        
    async def analyze_emotion(self, message: str) -> EmotionalContextModel:
        """
        Detect customer emotion from message using LLM with robust parsing
        """
        """
        Detect customer emotion from message using LLM with robust parsing
        """
        prompt = ChatPromptTemplate.from_template(
            """Analyse l'émotion, le sentiment ET LA LANGUE de ce message client.
            
            Message: "{message}"
            
            LANGUES POSSIBLES:
            - "fr": Français (French)
            - "en": Anglais (English)
            - "ar": Arabe Standard (Fus7a / Classical Arabic script)
            - "ma": Darija (Moroccan Arabic, including Arabizi text using numbers like '3', '7', '9' as letters, or mixed French/Arabic syntax)

            EXEMPLES DE DÉTECTION:
            - "Bonjour, je cherche une voiture" -> fr (French)
            - "I want a cheap car" -> en (English)
            - "Salam bghit tomobil" -> ma (Darija -> Arabizi)
            - "3jbatni had lhdida" -> ma (Darija -> Arabizi with numbers)
            - "Ch7al dayra hadi?" -> ma (Darija -> Arabizi)
            
             Réponds UNIQUEMENT en JSON valide:
            {{
                "primary_emotion": "neutral, happy, frustrated, excited, worried, budget_stressed, confused, satisfied",
                "sentiment_score": 0.0-1.0,
                "intensity": 1-10,
                "recommended_tone": "rassurant, énergique, empathique...",
                "language_reasoning": "Brief explanation (e.g. 'Arabizi detected via 3/7 numbers')",
                "detected_language": "code langue (fr/en/ar/ma)"
            }}
            
            ⚠️ IMPORTANT pour la langue: Si le client utilise des mots comme "Salam", "Bghit", "Tomobil", "Ch7al" ou des chiffres (3, 7, 9) pour écrire, c'est du DARIJA ("ma").
            """
        )
        
        try:
            chain = prompt | self.llm
            result = await chain.ainvoke({"message": message})
            
            # Robust parsing with escape handling
            content = result.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            # Clean up common escape issues
            content = content.strip()
            # Replace problematic backslashes that aren't valid JSON escapes
            # But preserve valid ones like \n, \t, \", \\
            import re
            # This regex preserves valid JSON escapes
            content = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', content)
            
            import json
            data = json.loads(content)
            
            # Normalize intensity
            raw_intensity = float(data.get("intensity", 5))
            normalized_intensity = min(1.0, max(0.0, raw_intensity / 10.0))
            
            return EmotionalContextModel(
                primary_emotion=EmotionType(data.get("primary_emotion", "neutral")),
                sentiment_score=float(data.get("sentiment_score", 0.5)),
                intensity=normalized_intensity,
                key_concerns=data.get("key_concerns", []),
                recommended_tone=data.get("recommended_tone", "professionnel"),
                recommended_strategy=data.get("recommended_strategy", "écoute active"),
                detected_language=data.get("detected_language", "fr")  # NEW: LLM Detected Language
            )
        except Exception as e:
            logger.error(f"Emotion analysis failed: {e}")
            return EmotionalContextModel(
                primary_emotion=EmotionType.NEUTRAL,
                intensity=0.5,
                sentiment_score=0.0,
                key_concerns=[],
                recommended_tone="professionnel",
                recommended_strategy="écoute active"
            )

    async def detect_intent(
        self, 
        message: str, 
        phase: str,
        recent_messages: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        LLM-based intent classification with confidence scoring.
        
        Returns:
            {
                "intent": NegotiationIntent,
                "confidence": 0.0-1.0,
                "reasoning": str,
                "needs_clarification": bool
            }
        """
        # Build context from recent messages (last 3)
        context_str = ""
        if recent_messages:
            for msg in recent_messages[-3:]:
                role = msg.get("role", "user")
                content = msg.get("content", msg.get("message", ""))
                context_str += f"{'Client' if role == 'user' else 'Agent'}: {content}\n"
        
        prompt = ChatPromptTemplate.from_template(
            """Tu es un expert en analyse de conversations commerciales automobiles.

CONTEXTE DE LA CONVERSATION:
Phase actuelle: {phase}
{context}

NOUVEAU MESSAGE DU CLIENT:
"{message}"

ANALYSE ce message et détermine:
1. L'intention principale du client
2. Ton niveau de confiance (0-100%)
3. Ton raisonnement

INTENTIONS POSSIBLES:
- ACCEPT: Le client accepte EXPLICITEMENT une offre de prix déjà proposée (ex: "OK je prends à ce prix", "D'accord pour 125,000 MAD")
- REJECT: Le client refuse explicitement (offre, véhicule, ou conversation)
- COUNTER_OFFER: Le client propose un autre prix/conditions (ex: "Je vous la prends à 123,000 MAD")
- PRICE_OBJECTION: Le client trouve le prix trop élevé (mais ne refuse pas)
- VEHICLE_INTEREST: Le client exprime son intérêt pour un véhicule SANS avoir reçu d'offre de prix (ex: "Je veux acheter cette voiture", "Je suis intéressé par la Clio")
- VEHICLE_REJECTION: Le client ne veut pas CE véhicule spécifique (mais cherche autre chose)
- REQUEST_INFO: Le client demande des informations (prix, caractéristiques, financement)
- BUDGET_MENTION: Le client mentionne son budget sans faire de contre-offre
- QUESTION: Le client pose une question (technique, financement, etc.)
- SHARE_NEEDS: Le client partage ses besoins/préférences
- HESITATION: Le client hésite, demande du temps, doit consulter quelqu'un
- GREETING: Salutation simple
- UNCLEAR: Impossible à déterminer avec certitude

⚠️ RÈGLES CRITIQUES: 
- ACCEPT ne doit être utilisé QUE si le client accepte une offre de PRIX déjà proposée
- "Je veux acheter cette voiture" SANS offre de prix = VEHICLE_INTEREST, PAS ACCEPT
- Prends en compte le CONTEXTE de la conversation
- "Non" seul peut être une réponse à une question, pas forcément un rejet
- Un client qui dit "c'est cher MAIS j'aime" n'est PAS en objection prix

Réponds UNIQUEMENT en JSON:
{{
    "intent": "CODE_INTENTION",
    "confidence": 0-100,
    "reasoning": "Explication courte de ton analyse"
}}"""
        )
        
        try:
            chain = prompt | self.llm
            result = await chain.ainvoke({
                "message": message, 
                "phase": phase,
                "context": context_str if context_str else "Pas de contexte précédent."
            })
            
            # Parse response
            content = result.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            import json
            data = json.loads(content)
            
            # Map to enum
            intent_str = data.get("intent", "UNCLEAR").upper()
            confidence = min(100, max(0, int(data.get("confidence", 50)))) / 100.0
            reasoning = data.get("reasoning", "")
            
            # Intent mapping
            intent_map = {
                "ACCEPT": NegotiationIntent.ACCEPT,
                "REJECT": NegotiationIntent.REJECT,
                "COUNTER_OFFER": NegotiationIntent.COUNTER_OFFER,
                "PRICE_OBJECTION": NegotiationIntent.BUDGET_MENTION,
                "VEHICLE_REJECTION": NegotiationIntent.REQUEST_ALTERNATIVE,
                "QUESTION": NegotiationIntent.REQUEST_INFO,
                "SHARE_NEEDS": NegotiationIntent.VEHICLE_INTEREST,
                "HESITATION": NegotiationIntent.EXPRESS_CONCERN,
                "GREETING": NegotiationIntent.GREETING,
                "UNCLEAR": NegotiationIntent.INQUIRY,
            }
            
            intent = intent_map.get(intent_str, NegotiationIntent.INQUIRY)
            
            # Determine if clarification needed (hybrid confidence logic)
            needs_clarification = confidence < 0.30
            
            logger.info(f"Intent detected: {intent.value} (conf: {confidence:.0%}) - {reasoning}")
            
            return {
                "intent": intent,
                "confidence": confidence,
                "reasoning": reasoning,
                "needs_clarification": needs_clarification
            }
            
        except Exception as e:
            if "429" in str(e):
                logger.error(f"RATE LIMIT REACHED (429) during intent detection. Using fallback.")
            else:
                logger.error(f"Intent detection failed: {e}")
                
            return {
                "intent": NegotiationIntent.INQUIRY,
                "confidence": 0.0,
                "reasoning": "Dépassement de quota ou erreur technique",
                "needs_clarification": True # Agent will override this if price is found
            }

    def extract_needs(self, message: str, current_needs: Dict[str, Any]) -> Dict[str, Any]:
        """Extract needs using regex patterns (Fast & Deterministic)"""
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
        
        needs = current_needs.copy() if current_needs else {}
        
        for need_type, pattern in NEEDS_PATTERNS.items():
            if pattern.search(message):
                needs[need_type] = True
        
        # Extract budget if mentioned
        budget_match = re.search(r'(\d+)\s*(k|K|000|dh|mad|درهم)?', message, re.I)
        if budget_match:
            amount_str = budget_match.group(1)
            # Basic validation to ensure it's a number and not None
            if amount_str and amount_str.isdigit():
                amount = int(amount_str)
                multiplier = budget_match.group(2)
                if multiplier and multiplier.lower() in ['k', '000']:
                    amount *= 1000
                if amount > 100:  # Likely a budget mention
                    needs['stated_budget'] = amount
        
        return needs

    def detect_cash_payment_intent(self, message: str) -> bool:
        """Detect if customer wants to pay in cash (one-time payment)."""
        message = message.lower()
        
        cash_patterns = [
            r'\b(cash|comptant|une fois|en une fois|payer tout|tout payer|pas de mensualit[ée]|sans mensualit[ée])\b',
            r'\b(combien pour (la |le )?prendre|quel (est le )?prix (total|cash)?)\b',
            r'\b(je (ne )?veux pas (de |d\' )?mensualit[ée]|pas int[ée]ress[ée] par mensualit[ée])\b',
            r'\b(payer? (en )?une seule fois|payant une seule fois|paiement (en )?une fois)\b',
            r'\b(prix total|co[uû]t total|montant total)\b',
            r'\b([àa] combien vous la vendez|quel est le prix)\b'
        ]
        
        for pattern in cash_patterns:
            if re.search(pattern, message, re.I):
                return True
        return False
    
    def extract_counter_offer_amount(self, message: str) -> Optional[float]:
        """Extract specific price amount from counter-offer"""
        # Clean message slightly for easier extraction
        msg = message.replace(',', '').replace(' ', '')
        
        # Patterns like "124000 MAD", "124 000", "124k", "124,000", etc.
        patterns = [
            r'(\d+)\s*k\b',  # 124k
            r'(\d{3,})\s*(mad|dh|dirham|dhs)?',  # 124000 MAD
            r'(\d+)[,\.\s](\d{3})\s*(mad|dh|dirham|dhs)?'  # 124,000 or 124.000 or 124 000
        ]
        
        # Try raw extraction first (without cleaning)
        for pattern in patterns:
            match = re.search(pattern, message, re.I)
            if match:
                if 'k' in pattern:
                    return float(match.group(1)) * 1000
                elif len(match.groups()) >= 2 and match.group(2) and match.group(2).isdigit():
                    # Format: "124 000", "124,000", "124.000"
                    return float(match.group(1) + match.group(2))
                else:
                    amount = float(match.group(1))
                    if amount > 1000:  # Likely a full price
                        return amount
        
        # Fallback to cleaned message if nothing found
        match = re.search(r'(\d{4,})', msg)
        if match:
            return float(match.group(1))
            
        return None

