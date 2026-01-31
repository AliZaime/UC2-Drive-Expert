const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
    this.apiKey = process.env.AI_SERVICE_API_KEY;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      },
      timeout: 30000 // 30 seconds timeout for AI processing
    });
  }

  /**
   * Check if AI service is healthy
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('AI Service health check failed:', error.message);
      return { status: 'offline', error: error.message };
    }
  }

  /**
   * Send a message to the AI Negotiation Agent
   * @param {Object} params - Negotiation parameters
   * @param {string} params.sessionId - Unique session ID
   * @param {string} params.customerMessage - The user's message
   * @param {Array} params.history - Conversation history [{speaker: 'agent'|'customer', message: string}]
   * @param {Object} params.currentOffer - Current offer details {monthly, duration, etc.}
   */
  async negotiate({ sessionId, customerMessage, history = [], currentOffer = {}, vehicle_context = null }) {
    try {
      logger.info(`Sending negotiation request for session ${sessionId}`);
      
      const payload = {
        session_id: sessionId,
        customer_message: customerMessage,
        conversation_history: history,
        current_offer: currentOffer,
        vehicle_context: vehicle_context // Pass vehicle data to Python
      };

      const response = await this.client.post('/ai/negotiate', payload);
      return response.data;
    } catch (error) {
      logger.error('AI Negotiation failed:', error.response?.data || error.message);
      // Fallback response if AI fails
      return {
        agent_message: "Je rencontre actuellement des difficultés techniques pour analyser votre demande. Un agent humain va prendre le relais.",
        emotional_analysis: {
          sentiment_score: 0,
          primary_emotion: "neutral"
        },
        error: true
      };
    }
  }

  /**
   * Get trade-in valuation from AI
   * @param {string} tradeInId - ID of the trade-in vehicle
   * @param {Object} vehicleData - Vehicle details {make, model, year, etc.}
   */
  async valuate(tradeInId, vehicleData) {
    try {
      logger.info(`Sending valuation request for trade-in ${tradeInId}`);
      
      const payload = {
        trade_in_id: tradeInId,
        vehicle: vehicleData,
        photos: [] // Add photo support later
      };

      const response = await this.client.post('/ai/valuation', payload);
      return response.data;
    } catch (error) {
      logger.error('AI Valuation failed:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new AIService();
