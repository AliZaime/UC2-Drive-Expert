const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

/**
 * @route   POST /api/conversations
 * @desc    Create or get existing conversation with a client
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        const { clientId } = req.body;
        
        if (!clientId) {
            return res.status(400).json({
                status: 'fail',
                message: 'Client ID is required'
            });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            client: clientId,
            agent: req.user.id,
            status: 'active'
        }).populate('client agent', 'firstName lastName name email');

        // Create new conversation if doesn't exist
        if (!conversation) {
            conversation = await Conversation.create({
                client: clientId,
                agent: req.user.id,
                participants: [req.user.id, clientId]
            });
            
            conversation = await Conversation.findById(conversation._id)
                .populate('client agent', 'firstName lastName name email');
        }

        res.status(200).json({
            status: 'success',
            data: { conversation }
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create conversation'
        });
    }
});

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const conversations = await Conversation.find({
            agent: req.user.id,
            status: { $ne: 'closed' }
        })
        .populate('client', 'firstName lastName email phone')
        .populate('agent', 'name email')
        .sort('-lastMessageAt');

        res.status(200).json({
            status: 'success',
            results: conversations.length,
            data: { conversations }
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch conversations'
        });
    }
});

/**
 * @route   GET /api/conversations/:id/messages
 * @desc    Get all messages for a conversation
 * @access  Private
 */
router.get('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verify user has access to this conversation
        const conversation = await Conversation.findOne({
            _id: id,
            agent: req.user.id
        });

        if (!conversation) {
            return res.status(404).json({
                status: 'fail',
                message: 'Conversation not found or access denied'
            });
        }

        const messages = await Message.find({ conversation: id })
            .populate('sender', 'name email')
            .sort('createdAt');

        res.status(200).json({
            status: 'success',
            results: messages.length,
            data: { messages }
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch messages'
        });
    }
});

/**
 * @route   PATCH /api/conversations/:id/read
 * @desc    Mark all messages in conversation as read
 * @access  Private
 */
router.patch('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verify access
        const conversation = await Conversation.findOne({
            _id: id,
            agent: req.user.id
        });

        if (!conversation) {
            return res.status(404).json({
                status: 'fail',
                message: 'Conversation not found'
            });
        }

        // Mark all unread messages as read
        await Message.updateMany(
            { 
                conversation: id,
                sender: { $ne: req.user.id },
                read: false
            },
            { 
                read: true,
                readAt: new Date()
            }
        );

        // Reset unread count
        conversation.unreadCount.agent = 0;
        await conversation.save();

        res.status(200).json({
            status: 'success',
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to mark messages as read'
        });
    }
});

module.exports = router;
