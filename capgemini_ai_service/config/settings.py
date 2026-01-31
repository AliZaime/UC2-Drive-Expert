import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Groq API
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    
    # Service
    service_name: str = os.getenv("SERVICE_NAME", "AI Negotiation Service")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8005"))
    
    # AI Model (using fast 8B for demo speed)
    default_model: str = os.getenv("DEFAULT_MODEL", "llama-3.1-8b-instant")
    temperature: float = float(os.getenv("TEMPERATURE", "0.7"))
    max_tokens: int = int(os.getenv("MAX_TOKENS", "2048"))

    # Financial Config
    lld_rate_48: float = float(os.getenv("LLD_RATE_48", "4.5"))
    lld_rate_36: float = float(os.getenv("LLD_RATE_36", "4.0"))
    credit_rate_60: float = float(os.getenv("CREDIT_RATE_60", "5.5"))
    credit_rate_48: float = float(os.getenv("CREDIT_RATE_48", "5.0"))
    subscription_markup: float = float(os.getenv("SUBSCRIPTION_MARKUP", "1.35"))

settings = Settings()
