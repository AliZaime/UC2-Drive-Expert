"""
🚗 AI Negotiation Demo UI
Streamlit interface to test all negotiation scenarios
"""
import streamlit as st
import requests
import json
from datetime import datetime
import uuid

import os

# Config
API_BASE = os.getenv("AI_SERVICE_URL", "http://127.0.0.1:8001")

st.set_page_config(
    page_title="🚗 AI Negotiation Demo",
    page_icon="🚗",
    layout="wide"
)

# Custom CSS
st.markdown("""
<style>
    .stApp { background-color: #0e1117; }
    .chat-user { background: #1e3a5f; padding: 10px; border-radius: 10px; margin: 5px 0; }
    .chat-agent { background: #2d4a3e; padding: 10px; border-radius: 10px; margin: 5px 0; }
    .emotion-badge { 
        display: inline-block; 
        padding: 3px 10px; 
        border-radius: 15px; 
        font-size: 12px;
        margin: 2px;
    }
    .emotion-positive { background: #28a745; color: white; }
    .emotion-negative { background: #dc3545; color: white; }
    .emotion-neutral { background: #6c757d; color: white; }
    .metric-card {
        background: #1a1a2e;
        padding: 15px;
        border-radius: 10px;
        text-align: center;
        border: 1px solid #333;
    }
    .vehicle-card {
        background: #1e222b;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 10px;
        margin-top: 10px;
        font-size: 0.9em;
    }
    .spec-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
        margin-top: 5px;
    }
    .spec-item {
        background: #2d3440;
        padding: 4px 8px;
        border-radius: 4px;
    }
</style>
""", unsafe_allow_html=True)

# Session state initialization
if "session_id" not in st.session_state:
    st.session_state.session_id = f"demo-{uuid.uuid4().hex[:8]}"
if "messages" not in st.session_state:
    st.session_state.messages = []
if "current_offer" not in st.session_state:
    st.session_state.current_offer = None
if "negotiation_active" not in st.session_state:
    st.session_state.negotiation_active = True

# Sidebar - Configuration
with st.sidebar:
    st.title("⚙️ Configuration")
    
    # Session info
    st.subheader("📋 Session")
    st.code(st.session_state.session_id)
    if st.button("🔄 New Session"):
        st.session_state.session_id = f"demo-{uuid.uuid4().hex[:8]}"
        st.session_state.messages = []
        st.session_state.current_offer = None
        st.session_state.negotiation_active = True
        st.rerun()
    
    st.divider()
    
    # Vehicle context - Load from inventory
    st.subheader("🚗 Vehicle")
    
    # Load inventory
    import json
    try:
        with open("data/inventory.json", "r", encoding="utf-8") as f:
            inventory = json.load(f)
        vehicle_options = {f"{v['make']} {v['model']} ({v['year']}) - {v['price']:,} MAD": v for v in inventory[:10]}
    except:
        vehicle_options = {"Dacia Jogger (2024) - 220,000 MAD": {"make": "Dacia", "model": "Jogger", "price": 220000, "costPrice": 195000}}
    
    selected_vehicle_name = st.selectbox("Select Vehicle:", list(vehicle_options.keys()))
    selected_vehicle = vehicle_options[selected_vehicle_name]
    
    vehicle_price = selected_vehicle.get("price", 220000)
    vehicle_cost = selected_vehicle.get("costPrice", vehicle_price * 0.85)
    vehicle_make = selected_vehicle.get("make", "Dacia")
    vehicle_model = selected_vehicle.get("model", "Jogger")
    
    st.caption(f"💰 Price: {vehicle_price:,} MAD | 🏷️ Cost: {vehicle_cost:,.0f} MAD")
    
    st.divider()
    
    # Trade-in
    st.subheader("🔄 Trade-In")
    has_trade_in = st.checkbox("Has trade-in vehicle")
    trade_in_value = st.number_input("Trade-in Value (MAD)", value=50000, step=5000, disabled=not has_trade_in)
    if not has_trade_in:
        trade_in_value = 0
    
    st.divider()
    
    # Language test presets
    st.subheader("🌍 Quick Test Messages")
    test_messages = {
        "🇫🇷 French - Too expensive": "Bonjour, c'est trop cher pour moi, vous pouvez faire un effort?",
        "🇬🇧 English - Negotiate": "Hello, the price is too expensive. Can you offer a better deal?",
        "🇸🇦 Arabic - Price concern": "مرحبا، السعر مرتفع جدا، هل يمكنك تخفيضه؟",
        "🇲🇦 Darija - Budget": "Salam, had tomobil ghalia bzaf, wach kayna chi offre?",
        "✅ Accept (FR)": "Ok parfait, je prends la voiture!",
        "✅ Accept (EN)": "Alright, I'll take it!",
        "❌ Reject (FR)": "Non merci, c'est pas pour moi",
        "😤 Frustrated": "C'est vraiment n'importe quoi ce prix! Je pars!",
        "🤔 Hesitant": "Je ne sais pas... laissez-moi réfléchir",
        "💰 Specific counter": "Je veux payer maximum 4000 MAD par mois"
    }
    
    selected_test = st.selectbox("Preset messages:", list(test_messages.keys()))
    if st.button("📝 Use this message"):
        st.session_state.preset_message = test_messages[selected_test]

# Main content
st.title("🚗 AI Negotiation Demo")
st.caption(f"Session: {st.session_state.session_id} | API: {API_BASE}")

# Check API health
api_ok = False
for attempt in range(3):
    try:
        health = requests.get(f"{API_BASE}/health", timeout=10).json()
        st.success(f"✅ API Connected | Groq: {'🟢' if health.get('groq_connected') else '🔴'}")
        api_ok = True
        break
    except requests.exceptions.ConnectionError as e:
        if attempt == 2:
            st.error(f"❌ Connection Error: Cannot connect to {API_BASE}")
            st.info("Run in terminal: `cd ai-service && uvicorn main:app --port 8005`")
    except requests.exceptions.Timeout:
        if attempt == 2:
            st.error(f"❌ Timeout after 3 attempts")
    except Exception as e:
        if attempt == 2:
            st.error(f"❌ Error: {e}")
    import time
    time.sleep(1)

if not api_ok:
    st.stop()

# Layout: Chat | Metrics
col_chat, col_metrics = st.columns([2, 1])

with col_chat:
    st.subheader("💬 Negotiation Chat")
    
    # Display chat history
    chat_container = st.container()
    with chat_container:
        for msg in st.session_state.messages:
            if msg["role"] == "user":
                st.markdown(f"""
                <div class="chat-user">
                    <strong>👤 Customer ({msg.get('language', '?')}):</strong><br>
                    {msg['content']}
                </div>
                """, unsafe_allow_html=True)
            else:
                emotion = msg.get('emotion', 'neutral')
                emotion_class = "positive" if emotion in ["happy", "satisfied", "excited"] else "negative" if emotion in ["frustrated", "angry", "budget_stressed"] else "neutral"
                # Build Vehicle Card HTML
                card_html = ""
                if msg.get("vehicle_card"):
                    vc = msg["vehicle_card"]
                    specs_html = ""
                    # Specs
                    count = 0
                    if vc.get("specs"):
                        for k, v in vc.get("specs").items():
                            if count < 4: # Limit to 4 specs
                                specs_html += f'<div class="spec-item"><strong>{k}:</strong> {v}</div>'
                                count += 1
                                
                    # Features (if specs empty or extra)
                    if vc.get("features") and count < 4:
                         for f in vc.get("features")[:2]:
                             specs_html += f'<div class="spec-item">✨ {f}</div>'

                    card_html = f"""<div class="vehicle-card"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;"><span style="font-weight: bold; font-size: 1.1em;">{vc.get('name')}</span><span style="color: #4CAF50; font-weight: bold;">{vc.get('price', 0):,} MAD</span></div><div class="spec-grid">{specs_html}</div></div>"""
                
                st.markdown(f"""
                <div class="chat-agent">
                    <strong>🤖 AI Agent:</strong>
                    <span class="emotion-badge emotion-{emotion_class}">{emotion}</span>
                    <span class="emotion-badge emotion-neutral">{msg.get('intent', '?')}</span>
                    <br><br>
                    {msg['content']}
                    {card_html}
                </div>
                """, unsafe_allow_html=True)
    
    # Input area
    if st.session_state.negotiation_active:
        # Check for preset message
        default_msg = st.session_state.pop("preset_message", "")
        
        user_input = st.text_area("Your message:", value=default_msg, height=80, key="user_input")
        
        col_send, col_clear = st.columns([1, 1])
        with col_send:
            send_button = st.button("📤 Send Message", type="primary", use_container_width=True)
        with col_clear:
            if st.button("🗑️ Clear Chat", use_container_width=True):
                st.session_state.messages = []
                st.session_state.current_offer = None
                st.rerun()
        
        if send_button and user_input.strip():
            # Build request with FULL vehicle data from inventory
            request_data = {
                "session_id": st.session_state.session_id,
                "customer_message": user_input,
                "current_offer": st.session_state.current_offer,
                "vehicle_context": {
                    "vehicle_id": selected_vehicle.get("id", "demo-v1"),
                    "make": vehicle_make,
                    "model": vehicle_model,
                    "price": vehicle_price,
                    "cost": vehicle_cost,
                    # Full data from inventory!
                    "year": selected_vehicle.get("year", 2024),
                    "condition": selected_vehicle.get("condition", ""),
                    "features": selected_vehicle.get("features", []),
                    "specifications": selected_vehicle.get("specifications", {}),
                    "mileage": selected_vehicle.get("mileage", 0),
                    "location": selected_vehicle.get("inventory", {}).get("location", "")
                }
            }
            
            if has_trade_in:
                request_data["trade_in_context"] = {
                    "trade_in_id": "demo-ti1",
                    "value": trade_in_value
                }
            
            # Add user message to chat
            st.session_state.messages.append({
                "role": "user",
                "content": user_input,
                "timestamp": datetime.now().isoformat()
            })
            
            # Call API
            with st.spinner("🤖 AI is thinking..."):
                try:
                    response = requests.post(
                        f"{API_BASE}/ai/negotiate",
                        json=request_data,
                        timeout=60
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        # Store response
                        st.session_state.last_response = data
                        st.session_state.current_offer = data.get("new_offer")
                        
                        # Add agent message to chat
                        msg_data = {
                            "role": "agent",
                            "content": data["agent_message"],
                            "emotion": data["emotional_analysis"]["primary_emotion"],
                            "intent": data["intent_detected"],
                            "language": data.get("detected_language", "?"),
                            "offer": data.get("new_offer"),
                            "vehicle_card": data.get("vehicle_card"),  # Store vehicle card
                            "timestamp": datetime.now().isoformat()
                        }
                        st.session_state.messages.append(msg_data)
                        
                        # Check if deal finalized
                        if data.get("should_finalize"):
                            st.session_state.negotiation_active = False
                            if data["intent_detected"] == "accept":
                                st.balloons()
                    else:
                        st.error(f"API Error: {response.text}")
                        
                except Exception as e:
                    st.error(f"Request failed: {e}")
            
            st.rerun()
    else:
        # Negotiation ended
        last_intent = st.session_state.messages[-1].get("intent", "") if st.session_state.messages else ""
        if last_intent == "accept":
            st.success("🎉 Deal Closed Successfully!")
        else:
            st.warning("❌ Negotiation Ended")
        
        if st.button("🔄 Start New Negotiation"):
            st.session_state.session_id = f"demo-{uuid.uuid4().hex[:8]}"
            st.session_state.messages = []
            st.session_state.current_offer = None
            st.session_state.negotiation_active = True
            st.rerun()

with col_metrics:
    st.subheader("📊 Live Metrics")
    
    if "last_response" in st.session_state:
        data = st.session_state.last_response
        
        # Current offer
        if data.get("new_offer"):
            offer = data["new_offer"]
            st.metric("💰 Monthly Payment", f"{offer.get('monthly', 0):,.0f} MAD")
            st.metric("📅 Duration", f"{offer.get('duration', 60)} months")
        
        st.divider()
        
        # Emotional analysis
        st.subheader("😊 Emotion Analysis")
        emotion = data["emotional_analysis"]
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Primary", emotion["primary_emotion"])
        with col2:
            st.metric("Intensity", f"{emotion['intensity']:.0%}")
        
        # Sentiment gauge
        sentiment = emotion["sentiment_score"]
        sentiment_color = "🟢" if sentiment > 0.3 else "🔴" if sentiment < -0.3 else "🟡"
        st.metric("Sentiment", f"{sentiment_color} {sentiment:.2f}")
        
        # Key concerns
        if emotion.get("key_concerns"):
            st.caption("Key concerns:")
            for concern in emotion["key_concerns"][:3]:
                st.caption(f"  • {concern}")
        
        st.divider()
        
        # Trend
        st.subheader("📈 Emotional Trend")
        trend_data = data.get("emotional_trend_details", {})
        if trend_data:
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Direction", trend_data.get("direction", "?"))
                st.metric("Risk", trend_data.get("risk_level", "?"))
            with col2:
                st.metric("Volatility", f"{trend_data.get('volatility', 0):.0%}")
                st.metric("Rounds", data.get("negotiation_round", 0))
        
        st.divider()
        
        # Win-Win Score
        st.subheader("⚖️ Win-Win Score")
        win_win = data.get("win_win_score", 0)
        st.progress(win_win / 100)
        st.caption(f"{win_win:.1f}/100 - {'Balanced deal' if 40 < win_win < 60 else 'Favors dealer' if win_win > 60 else 'Favors customer'}")
        
        st.divider()
        
        # Language & Intent
        st.subheader("🔍 Detection")
        col1, col2 = st.columns(2)
        with col1:
            lang_map = {"fr": "🇫🇷 French", "en": "🇬🇧 English", "ar": "🇸🇦 Arabic", "ma": "🇲🇦 Darija"}
            st.metric("Language", lang_map.get(data.get("detected_language", ""), "Unknown"))
        with col2:
            st.metric("Intent", data.get("intent_detected", "?"))
        
        # Alternatives
        if data.get("alternatives"):
            st.divider()
            st.subheader("🚗 Alternatives Suggested")
            for alt in data["alternatives"]:
                st.caption(f"• {alt['make']} {alt['model']} - {alt['price']:,} MAD")
        
        st.divider()
        
        # Agent steps (expandable)
        with st.expander("🔬 Agent Steps (Debug)"):
            for step in data.get("agent_steps", []):
                st.markdown(f"**{step['action']}** ({step['confidence']:.0%})")
                st.caption(step["reasoning"][:100] + "...")
        
        # Raw JSON
        with st.expander("📄 Raw Response"):
            st.json(data)
    else:
        st.info("Send a message to see metrics")

# Footer
st.divider()
st.caption("🚀 AI Negotiation Service | Capgemini Hackathon 2026 | Multi-language: FR 🇫🇷 | EN 🇬🇧 | AR 🇸🇦 | Darija 🇲🇦")
