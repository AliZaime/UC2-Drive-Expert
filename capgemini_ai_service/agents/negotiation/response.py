from typing import Dict, Any, Optional, List
import re
from langchain_core.prompts import ChatPromptTemplate
from schemas.models import EmotionalContextModel
from .language import LanguageDetector
from core.logger import logger

class ResponseGenerator:
    """Handles prompt engineering and text generation - SIMPLIFIED VERSION"""

    def __init__(self, llm):
        self.llm = llm
        self.language_detector = LanguageDetector()

    async def generate_response(
        self, 
        customer_msg: str, 
        emotion: EmotionalContextModel, 
        new_offer: Optional[Dict[str, Any]], 
        car_name: str,
        needs_str: str,
        phase: str,
        reasoning: str,
        language: str = "fr",
        vehicle_features: List[str] = None,
        vehicle_specs: Dict[str, Any] = None,
        vehicle_price: float = 0,
        vehicle_cost: float = 0, # NEW: Safety margin
        comparison_vehicles: List[Dict[str, Any]] = None,
        round_number: int = 1,
        session: Any = None
    ) -> str:
        """Generate phase-aware response"""
        
        language_instruction = self.language_detector.get_instruction(language)
        language_name = self.language_detector.get_name(language)
        
        # Detect if user wants CASH (one go)
        # Use session preference if set, otherwise detect from current msg
        pref = getattr(session, 'payment_preference', None)
        wants_cash = pref == "cash" or any(w in customer_msg.lower() for w in ["un coup", "une fois", "cash", "comptant", "one go"])

        # PERSONALITY & CONTINUITY
        is_initial = round_number <= 1
        greeting_instruction = "Accueille chaleureusement." if is_initial else "NE SALUE PAS, va droit au but (suite de la discussion)."

        # Offer Text Construction
        offer_text = ""
        last_proposed_price = session.negotiated_price or vehicle_price
        
        if new_offer:
            m = new_offer.get('monthly', 0)
            p = new_offer.get('price', last_proposed_price)
            dur = new_offer.get('duration', 60)
            
            if wants_cash:
                offer_text = f"PRIX CASH DÉFINITIF: {p:,.0f} MAD."
            else:
                offer_text = f"OFFRE ACTUELLE: {m:,.0f} MAD/mois sur {dur} mois (Total: {p:,.0f} MAD)."
        else:
            offer_text = f"PRIX ACTUELLEMENT PROPOSÉ: {last_proposed_price:,.0f} MAD."

        # Financing mode instruction
        current_monthly = new_offer.get('monthly', 0) if new_offer else 0
        current_duration = new_offer.get('duration', 60) if new_offer else 60

        if session.payment_preference == "cash":
            financing_instruction = f"Le client souhaite payer COMPTANT (en une fois). Présente UNIQUEMENT le prix total négocié de {p:,.0f} MAD. Ne mentionne PAS de mensualités ou de durée."
        else:
            financing_instruction = f"Présente l'offre en mensualités: {m:,.0f} MAD/mois sur {dur} mois. Si le client demande le prix total ou veut payer comptant, accepte et présente le prix total de {p:,.0f} MAD."

        # PERSONALITY VARIANTS: Avoid repetitive "Je comprends parfaitement"
        personality_variation = "Varie tes tournures de phrases. Évite de commencer chaque phrase par 'Je comprends'. Sois naturel et chaleureux."

        vehicle_info = car_name if car_name else "le véhicule"
        floor_price = vehicle_cost * 1.02 if vehicle_cost > 0 else vehicle_price * 0.9 # Hard safety
        
        # SIMPLIFIED: Only 3 templates 
        templates = {
            "discovery": f"""Tu es Karim, conseiller auto au Maroc.
            
Message client: "{{msg}}"
Véhicule: {vehicle_info}

PERSONNALITÉ:
- {greeting_instruction}
- {personality_variation}
- Pose une seule question de découverte.

⚠️ CONTRAINTE CRITIQUE: MAXIMUM 2-3 PHRASES COURTES. Sois direct et concis.
Réponds en {language_name}. {language_instruction}""",
                
            "negotiation": f"""Tu es Karim, conseiller commercial au Maroc.
            
Message: "{{msg}}"
Véhicule: {vehicle_info}
{offer_text}
{financing_instruction}
RAISONNEMENT INTERNE: {reasoning}

RÈGLES CRITIQUES:
- {greeting_instruction}
- {personality_variation}
- SI LE PRIX N'A PAS CHANGÉ: Ne répète pas le chiffre. Explique BRIÈVEMENT pourquoi (1 raison max).
- ANCHORING: Ton prix actuel est {offer_text}. 
- ⚠️ INTERDICTION ABSOLUE DE CALCUL: Tu ne peux PAS calculer de prix, de mensualités, ou de totaux. Tu ne peux QUE répéter les chiffres fournis ci-dessus dans {offer_text}.
- ⚠️ ZÉRO HALLUCINATION: Tu ne peux mentionner QUE les chiffres fournis dans {offer_text}. Ne propose pas d'autres montants que {p:,.0f} MAD.
- {financing_instruction}

⚠️ CONTRAINTE ABSOLUE: MAXIMUM 3 PHRASES. Pas de blabla. Va droit au but.
Évite les répétitions comme "Félicitations", "Excellent choix", "Qualité exceptionnelle".
Réponds en {language_name}. {language_instruction}""",
                
            "closing": f"""Tu es Karim, conseiller au Maroc.
            
Message: "{{msg}}"
Véhicule: {vehicle_info}
{offer_text}

Félicite BRIÈVEMENT le client pour {vehicle_info}.
{personality_variation}
Ne mentionne AUCUN autre chiffre.

⚠️ CONTRAINTE: MAXIMUM 2 PHRASES. Sois chaleureux mais concis.
Réponds en {language_name}. {language_instruction}"""
        }

        template = templates.get(phase, templates["negotiation"])
        prompt = ChatPromptTemplate.from_template(template)
        
        try:
            chain = prompt | self.llm
            res = await chain.ainvoke({
                "msg": customer_msg,
                "tone": emotion.recommended_tone,
                "reasoning": reasoning
            })
            return res.content
        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            if new_offer:
                p = new_offer.get('price', 0)
                m = new_offer.get('monthly', 0)
                if wants_cash:
                    return f"Je m'excuse, j'ai une petite difficulté technique, mais voici mon offre : {p:,.0f} MAD cash pour la {car_name}."
                else:
                    return f"Je m'excuse, j'ai une petite difficulté technique, mais voici mon offre : {m:,.0f} MAD/mois pour la {car_name} (Total: {p:,.0f} MAD)."
            return "Désolé, je rencontre une petite difficulté technique. Pouvons-nous reprendre dans un instant ?"
