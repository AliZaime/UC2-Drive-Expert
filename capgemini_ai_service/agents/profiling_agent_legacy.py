from typing import Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from agents import get_llm
from core.logger import logger

class CustomerProfileResult(BaseModel):
    """Structured output for customer profiling"""
    segment: str = Field(description="Customer segment (e.g., Family Oriented, Young Professional, Budget Conscious)")
    price_sensitivity: str = Field(description="High, Medium, or Low")
    priorities: List[str] = Field(description="List of top 3 vehicle priorities")
    communication_style: str = Field(description="Preferred communication style (e.g., Direct, Detailed, Emotional)")
    recommended_strategy: str = Field(description="Strategic advice for the negotiation agent")

class CustomerProfilingAgent:
    def __init__(self):
        self.llm = get_llm()
        self.parser = JsonOutputParser(pydantic_object=CustomerProfileResult)
        
    async def analyze_profile(self, 
                       conversation_history: List[Dict[str, str]], 
                       stated_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyze conversation to build a psychographic profile.
        Async execution.
        """
        log = logger.bind(agent="ProfilingAgent")
        
        # Smart Context Limiting: Only take last 10 turns to avoid token explosion
        recent_history = conversation_history[-10:] if conversation_history else []
        
        # Flatten conversation for analysis
        customer_text = "\n".join([
            f"Customer: {msg['message']}" 
            for msg in recent_history 
            if msg.get('speaker') == 'customer' or msg.get('role') == 'user'
        ])
        
        # If no chat history yet, rely on preferences
        if not customer_text:
            if stated_preferences:
                customer_text = f"Initial Preferences: {str(stated_preferences)}"
            else:
                 return self._get_fallback_profile()
            
        prompt = ChatPromptTemplate.from_template("""
        Tu es un expert en psychologie du consommateur pour un concessionnaire automobile.
        Analyse les messages récents et préférences de ce client pour cernes son profil psychographique.
        
        MESSAGES CLIENT (Récents):
        {customer_text}
        
        PRÉFÉRENCES DÉCLARÉES:
        {preferences}
        
        Tâche:
        1. Détermine le segment client (Ex: Famille, Tech, Luxe, Étudiant, Pro).
        2. Évalue la sensibilité au prix (Haute = budget serré, Basse = veut le meilleur).
        3. Identifie les priorités implicites (Sécurité, Image, Confort, Économie).
        4. Suggère le style de communication idéal.
        
        {format_instructions}
        """)
        
        chain = prompt | self.llm | self.parser
        
        try:
            log.info("profiling_start", input_length=len(customer_text))
            
            result = await chain.ainvoke({
                "customer_text": customer_text,
                "preferences": str(stated_preferences or {}),
                "format_instructions": self.parser.get_format_instructions()
            })
            
            # Add metadata
            result["confidence_score"] = 0.85 # Placeholder, could be calculated
            
            log.info("profiling_complete", segment=result.get("segment"))
            return result
            
        except Exception as e:
            log.error("profiling_error", error=str(e))
            return self._get_fallback_profile()
            
    def _get_fallback_profile(self) -> Dict[str, Any]:
        return {
            "segment": "Standard",
            "price_sensitivity": "Medium",
            "priorities": ["Price", "Reliability"],
            "communication_style": "Professional",
            "recommended_strategy": "Focus on value and reliability",
            "confidence_score": 0.5
        }

# Singleton instance
profiling_agent = CustomerProfilingAgent()
