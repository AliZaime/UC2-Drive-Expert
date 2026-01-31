import re
from typing import Dict

class LanguageDetector:
    """Handles language detection and localization resources"""
    
    # Patterns for language detection
    PATTERNS = {
        "ar": re.compile(r'[\u0600-\u06FF]'),  # Arabic script
        "en": re.compile(r'\b(hello|hi|thanks|thank|please|pls|car|vehicle|price|cost|expensive|cheap|deal|ok|okay|yes|no|want|looking|need|family|budget|finance|financing|option|options|payment|monthly|pay|discount|much|negotiate)\b', re.I),
        "fr": re.compile(r'\b(bonjour|salut|merci|svp|plaît|voiture|usagé|prix|coût|cher|moins|offre|accord|oui|non|je veux|cherche|besoin|famille|budget|financement|option|options|paiement|mensuel|remise|combien|négocier)\b', re.I),
        "ma": re.compile(r'\b(salam|wach|bghit|bghet|bzaf|safi|mezyan|wakha|dyal|diel|dyalha|tomobil|tonobil|3afak|chhal|flouss|floss|familiya|ghalia|rkhissa|taman|prix)\b', re.I),  # Darija (romanized)
    }
    
    # System prompts instructions per language
    PROMPTS = {
        "fr": "Réponds en français de manière professionnelle et chaleureuse.",
        "en": "Respond in English in a professional and warm manner.",
        "ar": "أجب باللغة العربية الفصحى بأسلوب مهني ودافئ.",
        "ma": "Jaweb b darija maghribiya, b ta9a professionnelle w 7nina.",
    }
    
    # Language display names
    NAMES = {
        "fr": "Français", 
        "en": "English", 
        "ar": "العربية", 
        "ma": "Darija Marocaine"
    }

    def detect(self, text: str) -> str:
        """Detect language from customer message (FR/EN/AR/MA)"""
        if not text:
            return "fr"

        # Check for Arabic script first (highest priority)
        if self.PATTERNS["ar"].search(text):
            # Check for Darija-specific words within Arabic text
            if self.PATTERNS["ma"].search(text):
                return "ma"  # Moroccan Darija
            return "ar"  # Modern Standard Arabic
        
        # Check for Darija romanized (Arabizi)
        if self.PATTERNS["ma"].search(text):
            return "ma"
        
        # Count French vs English matches
        fr_matches = len(self.PATTERNS["fr"].findall(text))
        en_matches = len(self.PATTERNS["en"].findall(text))
        
        if fr_matches > en_matches:
            return "fr"
        elif en_matches > fr_matches:
            return "en"
        
        return "fr"  # Default to French for Morocco

    def get_instruction(self, lang: str) -> str:
        """Get system prompt instruction for a language"""
        return self.PROMPTS.get(lang, self.PROMPTS["fr"])

    def get_name(self, lang: str) -> str:
        """Get display name for a language"""
        return self.NAMES.get(lang, "Français")
