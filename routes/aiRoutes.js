const express = require('express');
const router = express.Router();
const AIService = require('../services/AIService');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/ai/valuation
 * @desc    Get vehicle valuation from AI
 * @access  Private
 */
router.post('/valuation', protect, async (req, res) => {
    try {
        const { tradeInId, vehicle } = req.body;
        
        if (!vehicle) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vehicle data is required' 
            });
        }

        const valuation = await AIService.valuate(tradeInId || 'TEMP_ID', vehicle);

        res.json({
            success: true,
            data: valuation
        });
    } catch (error) {
        console.error('AI Valuation route error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'AI Service Error',
            error: error.message 
        });
    }
});

/**
 * @route   GET /api/ai/health
 * @desc    Check AI service health
 * @access  Public
 */
router.get('/health', async (req, res) => {
    const health = await AIService.checkHealth();
    res.json(health);
});

module.exports = router;
