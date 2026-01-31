"""
Deal Structuring Agent with Deterministic Financial Calculations
LLM is ONLY used for creative naming and descriptions, NOT for math
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from langchain_core.prompts import ChatPromptTemplate
from agents import get_llm

import json


@dataclass
class FinancingOption:
    """Calculated financing option"""
    type: str
    monthly_payment: float
    duration_months: int
    down_payment: float
    total_cost: float
    interest_rate: float
    included_services: List[str]


class FinancialCalculator:
    """Deterministic financial calculations - NO LLM involvement"""
    
    @staticmethod
    def calculate_monthly_payment(principal: float, annual_rate: float, months: int) -> float:
        """
        Standard amortization formula for monthly payment
        PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
        """
        if months <= 0:
            return 0.0
        if annual_rate <= 0:
            return principal / months
            
        monthly_rate = annual_rate / 100 / 12
        factor = (1 + monthly_rate) ** months
        payment = principal * (monthly_rate * factor) / (factor - 1)
        return round(payment, 2)
    
    @staticmethod
    def calculate_total_cost(monthly: float, months: int, down_payment: float = 0) -> float:
        """Total cost over the life of the financing"""
        return round(monthly * months + down_payment, 2)
    
    @staticmethod
    def calculate_lld_payment(vehicle_price: float, residual_percent: float, 
                               annual_rate: float, months: int) -> float:
        """
        LLD (Location Longue Durée) calculation
        You finance the depreciation, not the full value
        """
        residual_value = vehicle_price * (residual_percent / 100)
        financed_amount = vehicle_price - residual_value
        return FinancialCalculator.calculate_monthly_payment(financed_amount, annual_rate, months)
    
    @staticmethod
    def calculate_subscription_payment(vehicle_price: float, markup: float, months: int) -> float:
        """
        Subscription model - all-inclusive with markup
        """
        base_monthly = vehicle_price / months
        return round(base_monthly * markup, 2)



from config.settings import settings as global_settings, Settings

class DealStructuringAgent:
    """
    Agent that structures financial deals
    - Uses DETERMINISTIC formulas for all calculations
    - Uses LLM ONLY for naming and descriptions
    """
    
    def __init__(self, settings: Settings = None):
        self.llm = get_llm()
        self.calculator = FinancialCalculator()
        self.settings = settings or global_settings
        
        # Financial Config - from injected settings
        self.config = {
            "lld": {
                "rate_48": self.settings.lld_rate_48,
                "rate_36": self.settings.lld_rate_36,
                "residual_48": 35,  # 35% residual value after 48 months
                "residual_36": 45,
            },
            "credit": {
                "rate_60": self.settings.credit_rate_60,
                "rate_48": self.settings.credit_rate_48,
            },
            "subscription": {
                "markup": self.settings.subscription_markup,
                "min_months": 12,
            }
        }
        
        # Services by type
        self.services = {
            "lld": ["Entretien complet", "Assurance tous risques", "Assistance 24/7", "Véhicule de remplacement"],
            "credit": ["Garantie constructeur", "Première révision offerte"],
            "subscription": ["Entretien", "Assurance", "Assistance", "Flexibilité résiliation", "Changement de véhicule"],
            "cash": ["Garantie constructeur", "Immatriculation offerte"]
        }
    
    def _calculate_all_options(self, vehicle_price: float, trade_in_value: float, 
                                down_payment: float = 0) -> List[FinancingOption]:
        """Calculate all financing options with deterministic math"""
        
        net_to_finance = vehicle_price - trade_in_value - down_payment
        options = []
        
        # Option 1: LLD 48 months
        lld_monthly = self.calculator.calculate_lld_payment(
            vehicle_price=vehicle_price,
            residual_percent=self.config["lld"]["residual_48"],
            annual_rate=self.config["lld"]["rate_48"],
            months=48
        )
        # Add trade-in benefit as reduced payment
        trade_in_monthly_benefit = trade_in_value / 48
        lld_monthly_adjusted = max(lld_monthly - trade_in_monthly_benefit, 500)
        
        options.append(FinancingOption(
            type="LLD",
            monthly_payment=round(lld_monthly_adjusted, -1),  # Round to nearest 10
            duration_months=48,
            down_payment=down_payment,
            total_cost=self.calculator.calculate_total_cost(lld_monthly_adjusted, 48, down_payment),
            interest_rate=self.config["lld"]["rate_48"],
            included_services=self.services["lld"]
        ))
        
        # Option 2: Credit 60 months
        credit_monthly = self.calculator.calculate_monthly_payment(
            principal=net_to_finance,
            annual_rate=self.config["credit"]["rate_60"],
            months=60
        )
        options.append(FinancingOption(
            type="Credit",
            monthly_payment=round(credit_monthly, -1),
            duration_months=60,
            down_payment=down_payment,
            total_cost=self.calculator.calculate_total_cost(credit_monthly, 60, down_payment),
            interest_rate=self.config["credit"]["rate_60"],
            included_services=self.services["credit"]
        ))
        
        # Option 3: Subscription 24 months
        sub_monthly = self.calculator.calculate_subscription_payment(
            vehicle_price=vehicle_price,
            markup=self.config["subscription"]["markup"],
            months=24
        )
        # Trade-in applied as initial credit
        sub_monthly_adjusted = sub_monthly - (trade_in_value / 24)
        
        options.append(FinancingOption(
            type="Subscription",
            monthly_payment=round(max(sub_monthly_adjusted, 1000), -1),
            duration_months=24,
            down_payment=0,  # Subscriptions typically no down payment
            total_cost=self.calculator.calculate_total_cost(sub_monthly_adjusted, 24, 0),
            interest_rate=0,  # Not applicable
            included_services=self.services["subscription"]
        ))
        
        # Option 4: Cash (only if reasonable)
        if net_to_finance < vehicle_price * 0.8:  # Has significant trade-in
            options.append(FinancingOption(
                type="Cash",
                monthly_payment=0,
                duration_months=0,
                down_payment=net_to_finance,
                total_cost=net_to_finance,
                interest_rate=0,
                included_services=self.services["cash"]
            ))
        
        return options
    
    def _select_best_options(self, options: List[FinancingOption], 
                              profile: Dict[str, Any]) -> List[FinancingOption]:
        """Select top 3 options based on customer profile"""
        
        sensitivity = profile.get("price_sensitivity", "Medium").lower()
        priorities = [p.lower() for p in profile.get("priorities", [])]
        budget = profile.get("monthly_budget", 5000)
        
        # Score each option
        scored = []
        for opt in options:
            score = 0
            
            # Budget fit (higher score if under budget)
            if opt.monthly_payment > 0:
                if opt.monthly_payment <= budget:
                    score += 30
                elif opt.monthly_payment <= budget * 1.1:
                    score += 15
            else:
                score += 10  # Cash option
            
            # Price sensitivity matching
            if sensitivity == "high":
                # Prefer lower monthly payments
                if opt.type == "Credit":
                    score += 20  # Longer term = lower monthly
                elif opt.type == "Subscription":
                    score -= 10  # Usually more expensive
            elif sensitivity == "low":
                # Prefer ownership or flexibility
                if opt.type in ["Credit", "Cash"]:
                    score += 15
            
            # Priority matching
            if "flexibility" in priorities or "flexibilité" in priorities:
                if opt.type == "Subscription":
                    score += 25
            if "ownership" in priorities or "propriété" in priorities:
                if opt.type in ["Credit", "Cash"]:
                    score += 25
            if "peace of mind" in priorities or "tranquillité" in priorities:
                if opt.type == "LLD":
                    score += 25
            if "low cost" in priorities or "économie" in priorities:
                score += int((budget - opt.monthly_payment) / 100) if opt.monthly_payment > 0 else 0
            
            scored.append((score, opt))
        
        # Sort by score descending, take top 3
        scored.sort(key=lambda x: x[0], reverse=True)
        return [opt for _, opt in scored[:3]]
    
    async def _generate_creative_names(self, options: List[FinancingOption], 
                                        profile: Dict[str, Any]) -> Dict[str, Any]:
        """Use LLM ONLY for creative naming and descriptions"""
        
        # Build options summary for LLM
        options_text = ""
        for i, opt in enumerate(options, 1):
            options_text += f"""
Option {i}:
- Type: {opt.type}
- Mensualité: {opt.monthly_payment} MAD/mois
- Durée: {opt.duration_months} mois
- Apport: {opt.down_payment} MAD
- Services: {', '.join(opt.included_services)}
"""
        
        prompt = ChatPromptTemplate.from_template("""
Tu es un expert en marketing automobile.
Donne des noms commerciaux attractifs et des descriptions persuasives pour ces options.

PROFIL CLIENT:
Segment: {segment}
Priorités: {priorities}

OPTIONS CALCULÉES:
{options_text}

Pour CHAQUE option, fournis:
1. Un nom commercial accrocheur (ex: "Pack Sérénité Famille", "Liberté Totale")
2. Une description persuasive de 1-2 phrases adaptée au profil

IMPORTANT: 
- NE MODIFIE PAS les chiffres (mensualités, durées, apports)
- Adapte le ton au segment client

Réponds UNIQUEMENT en JSON valide:
{{
  "options": [
    {{"index": 1, "name": "Nom Commercial", "description": "Description persuasive..."}},
    {{"index": 2, "name": "...", "description": "..."}},
    {{"index": 3, "name": "...", "description": "..."}}
  ],
  "recommendation": "Quelle option recommander et pourquoi (1 phrase)"
}}
""")
        
        try:
            chain = prompt | self.llm
            response = await chain.ainvoke({
                "segment": profile.get("segment", "Standard"),
                "priorities": str(profile.get("priorities", [])),
                "options_text": options_text
            })
            
            # Parse response
            content = response.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            elif "{" in content:
                start = content.find("{")
                end = content.rfind("}") + 1
                content = content[start:end]
            
            creative = json.loads(content)
            return creative
            
        except Exception as e:
            print(f"Creative naming failed: {e}, using defaults")
            return {
                "options": [
                    {"index": i+1, "name": f"Formule {opt.type}", "description": f"Option {opt.type} adaptée à vos besoins."}
                    for i, opt in enumerate(options)
                ],
                "recommendation": "Choisissez l'option qui correspond le mieux à votre budget."
            }
    
    async def structure_deal(self, vehicle_price: float, trade_in_value: float, 
                              profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point - structures financial deal options
        
        1. Calculate ALL options with deterministic math
        2. Select best 3 based on profile
        3. Use LLM only for creative naming
        4. Return structured response
        """
        
        # Step 1: Calculate all options (NO LLM)
        all_options = self._calculate_all_options(vehicle_price, trade_in_value)
        
        # Step 2: Select best 3 for this profile (NO LLM)
        best_options = self._select_best_options(all_options, profile)
        
        # Step 3: Get creative names (LLM for creativity only)
        creative = await self._generate_creative_names(best_options, profile)
        
        # Step 4: Merge calculated data with creative names
        final_options = []
        for i, opt in enumerate(best_options):
            creative_data = creative.get("options", [])[i] if i < len(creative.get("options", [])) else {}
            
            final_options.append({
                "option_name": creative_data.get("name", f"Formule {opt.type}"),
                "type": opt.type,
                "monthly_payment": opt.monthly_payment,
                "duration_months": opt.duration_months,
                "down_payment": opt.down_payment,
                "total_cost": opt.total_cost,
                "interest_rate": opt.interest_rate,
                "included_services": opt.included_services,
                "description": creative_data.get("description", f"Option {opt.type} adaptée à vos besoins.")
            })
        
        return {
            "options": final_options,
            "recommendation": creative.get("recommendation", "Choisissez selon votre budget et vos priorités."),
            "calculation_details": {
                "vehicle_price": vehicle_price,
                "trade_in_value": trade_in_value,
                "net_to_finance": vehicle_price - trade_in_value,
                "rates_applied": {
                    "lld_48": self.config["lld"]["rate_48"],
                    "credit_60": self.config["credit"]["rate_60"]
                }
            }
        }


# Singleton instance
deal_agent = DealStructuringAgent()
