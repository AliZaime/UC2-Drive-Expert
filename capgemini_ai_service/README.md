# 🤖 UC2 AI Core: The Negotiation Engine

> **Multi-Agent Orchestration with Emotional Intelligence & Explainable AI (XAI)**
> Dedicated AI Service for the **Capgemini Agentic AI Hackathon 🇲🇦**

---

## 🚀 Quick Start

### **Prerequisites**

- Python 3.9+
- Groq API Key ([get one here](https://console.groq.com))

### **Installation**

```bash
cd ai-service

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Add your Groq API key to .env
GROQ_API_KEY = your_actual_key_here
```

### **Run the Service**

```bash
# Development mode (with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

Service will be available at: `http://localhost:8001`

API documentation: `http://localhost:8001/docs`

---

## 📁 Project Structure

```
ai-service/
├── agents/
│   ├── __init__.py
│   ├── valuation_agent.py      # Trade-in valuation with explainable AI
│   └── negotiation_agent.py    # Negotiation with emotional intelligence
├── schemas/
│   ├── __init__.py
│   ├── types.py                # Type definitions
│   └── models.py               # Pydantic models for API
├── config/
│   ├── __init__.py
│   └── settings.py             # Configuration
├── main.py                     # FastAPI application
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🔌 API Endpoints

### **Health Check**

```http
GET /health
```

Response:

```json
{
  "status": "healthy",
  "service": "AI Negotiation Service",
  "timestamp": "2026-01-20T15:00:00",
  "groq_connected": true
}
```

---

### **Trade-In Valuation**

```http
POST /ai/valuation
```

Request:

```json
{
  "trade_in_id": "TRADE123",
  "vehicle": {
    "make": "Renault",
    "model": "Clio",
    "year": 2015,
    "mileage": 95000,
    "condition": "Bon",
    "service_history": true,
    "accidents": false
  },
  "photos": ["https://cloudinary.com/photo1.jpg"]
}
```

Response:

```json
{
  "trade_in_id": "TRADE123",
  "estimated_value": 72000,
  "value_range": { "min": 68000, "max": 78000 },
  "breakdown": {
    "base_price": 70000,
    "adjustments": [
      {
        "factor": "Historique d'entretien complet",
        "amount": 2100,
        "percentage": 3.0,
        "reasoning": "Entretien régulier et documenté..."
      }
    ],
    "market_comparables": 12,
    "confidence": 0.87,
    "final_value": 72000
  },
  "agent_steps": [
    {
      "agent_name": "Valuation Agent",
      "action": "Recherche prix marché",
      "reasoning": "Consulté les données du marché marocain...",
      "confidence": 0.85
    }
  ]
}
```

**✨ Features:**

- Explainable AI with step-by-step reasoning
- Moroccan market data
- Transparent pricing breakdown
- Confidence scores for each decision

---

### **Negotiation Turn**

```http
POST /ai/negotiate
```

Request:

```json
{
  "session_id": "NEG123",
  "customer_message": "C'est trop cher, pouvez-vous faire 2,700 MAD?",
  "conversation_history": [
    { "speaker": "agent", "message": "Je vous propose 2,900 MAD/mois" },
    { "speaker": "customer", "message": "C'est trop cher..." }
  ],
  "current_offer": {
    "monthly": 2900,
    "duration": 60
  }
}
```

Response:

```json
{
  "session_id": "NEG123",
  "agent_message": "Je comprends votre préoccupation budgétaire. Plutôt que de baisser à 2,700 MAD, je peux vous proposer 2,750 MAD/mois + 1 an d'entretien gratuit...",
  "emotional_analysis": {
    "primary_emotion": "budget_stressed",
    "intensity": 0.7,
    "sentiment_score": -0.3,
    "key_concerns": ["prix", "budget"],
    "recommended_tone": "empathetic",
    "recommended_strategy": "offer_flexibility"
  },
  "intent_detected": "counter_offer",
  "new_offer": {
    "monthly": 2750,
    "duration": 60
  },
  "alternatives": [],
  "agent_steps": [
    {
      "agent_name": "Negotiation Agent",
      "action": "Analyse émotionnelle",
      "reasoning": "Détection d'émotion budget_stressed...",
      "confidence": 0.78
    }
  ],
  "should_finalize": false
}
```

**✨ Features:**

- Emotional intelligence (detects frustration, worry, happiness, etc.)
- Intent classification (counter-offer, accept, reject, etc.)
- Adaptive negotiation strategy
- Empathetic response generation
- Win-win optimization

---

## 🎯 Key Features

### **1. Explainable AI (Transparency)**

Every decision includes:

- Step-by-step reasoning
- Confidence scores
- Data sources
- Adjustment breakdowns

### **2. Emotional Intelligence (Empathy)**

- Emotion detection from customer messages
- Adaptive tone and strategy
- Concern identification
- Empathetic response generation

### **3. Moroccan Market Specialization**

- Local pricing data
- Popular brands (Dacia, Renault, Peugeot)
- MAD currency
- French language

### **4. Win-Win Optimization**

- Maintains dealer margins (8-12%)
- Respects customer budgets
- Transparent process
- Fair negotiations

---

## 🧠 Agents

### **Valuation Agent**

- Analyzes trade-in vehicles
- Compares with market data
- Calculates fair value
- Explains every adjustment
- Provides confidence scores

### **Negotiation Agent**

- Detects customer emotions
- Classifies intent
- Adapts strategy dynamically
- Generates empathetic responses
- Offers creative alternatives

---

## 🔧 Configuration

Edit `.env` file:

```bash
# Groq API
GROQ_API_KEY=your_key_here

# Service
SERVICE_NAME=AI Negotiation Service
HOST=0.0.0.0
PORT=8001

# AI Model
DEFAULT_MODEL=llama-3.3-70b-versatile
TEMPERATURE=0.7
MAX_TOKENS=2048
```

---

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:8001/health

# Test valuation (example)
curl -X POST http://localhost:8001/ai/valuation \
  -H "Content-Type: application/json" \
  -d '{"trade_in_id":"TEST1", "vehicle":{"make":"Renault","model":"Clio","year":2015,"mileage":95000,"condition":"Bon","service_history":true,"accidents":false}}'

# View interactive API docs
open http://localhost:8001/docs
```

---

## 📊 Integration with Backend

The AI service is called by the Express backend:

```javascript
// Backend calls AI service
const response = await axios.post("http://localhost:8001/ai/valuation", {
  trade_in_id: tradeInId,
  vehicle: vehicleData,
});

const valuation = response.data;
```

---

## 🚀 Deployment

For production:

```bash
# Install production server
pip install gunicorn

# Run with gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

Or use Docker:

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## 📝 Notes

- Valuation uses mock Moroccan market data (in production, connect to real API)
- Emotional detection uses keyword matching + LLM (can be enhanced with fine-tuned models)
- All responses are in French for Moroccan market
- Pricing is in MAD (Moroccan Dirham)

---

## 🏆 Hackathon Features

This AI service includes **2 major differentiators**:

1. **Explainable AI** - Every decision is transparent and traceable
2. **Emotional Intelligence** - Adapts to customer emotions for better experience

These features align with Capgemini's AI Ethics Charter and demonstrate sophisticated agentic AI architecture.

---

**Built for Hackathon National GenAI & Agentic AI 2025** 🇲🇦
