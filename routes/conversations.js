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
        const { clientId, participantIds, vehicleId, subject } = req.body;
        
        // Support both old format (clientId + agent) and new format (participantIds)
        let client, agent, conversationParticipants;
        
        if (participantIds && participantIds.length >= 2) {
            // New format: array of participant IDs
            conversationParticipants = participantIds;
            // First participant is client, second is agent/user
            client = participantIds[0];
            agent = participantIds[1];
        } else if (clientId) {
            // Old format: clientId provided
            client = clientId;
            agent = req.user.id;
            conversationParticipants = [client, agent];
        } else {
            return res.status(400).json({
                status: 'fail',
                message: 'Either clientId or participantIds is required'
            });
        }

        // Check if conversation already exists (with vehicle-specific lookup)
        let conversation;
        
        // If vehicleId is provided, ALWAYS create a new conversation for each vehicle
        // Even if conversation with same client/agent exists (but different vehicle)
        if (vehicleId) {
            // Only reuse if EXACT same vehicleId, client, and agent
            conversation = await Conversation.findOne({
                vehicleId: vehicleId,
                client: client,
                agent: agent
            }).populate('client agent', 'name email');
            
            // Create new conversation if doesn't exist
            if (!conversation) {
                console.log(`📝 Creating new conversation for vehicle ${vehicleId}`);
                conversation = await Conversation.create({
                    client: client,
                    agent: agent,
                    participants: conversationParticipants,
                    vehicleId: vehicleId,
                    subject: subject || '',
                    status: 'active'
                });
                
                conversation = await Conversation.findById(conversation._id)
                    .populate('client agent', 'name email');
            } else {
                console.log(`♻️ Reusing conversation for vehicle ${vehicleId}`);
            }
        } else {
            // No vehicleId provided, check generic conversation (legacy support)
            conversation = await Conversation.findOne({
                client: client,
                agent: agent,
                vehicleId: { $exists: false }
            }).populate('client agent', 'name email');
            
            // Create new conversation if doesn't exist
            if (!conversation) {
                console.log(`📝 Creating new generic conversation (no vehicle)`);
                conversation = await Conversation.create({
                    client: client,
                    agent: agent,
                    participants: conversationParticipants,
                    subject: subject || '',
                    status: 'active'
                });
                
                conversation = await Conversation.findById(conversation._id)
                    .populate('client agent', 'name email');
            } else {
                console.log(`♻️ Reusing generic conversation`);
            }
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
 * @desc    Get all conversations for current user (agent or client)
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        // Support both agents and clients
        // Agents: conversations where they are agent
        // Clients: conversations where they are in participants or client field
        const conversations = await Conversation.find({
            $or: [
                { agent: req.user.id, status: { $ne: 'closed' } },
                { participants: req.user.id, status: { $ne: 'closed' } },
                { client: req.user.id, status: { $ne: 'closed' } }
            ]
        })
        .populate('client', 'name email phone')
        .populate('agent', 'name email')
        .populate('participants', 'name email')
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
        
        // Verify user has access to this conversation (agent, client, or participant)
        const conversation = await Conversation.findOne({
            _id: id,
            $or: [
                { agent: req.user.id },
                { client: req.user.id },
                { participants: req.user.id }
            ]
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
        
        // Verify access (agent, client, or participant)
        const conversation = await Conversation.findOne({
            _id: id,
            $or: [
                { agent: req.user.id },
                { client: req.user.id },
                { participants: req.user.id }
            ]
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

/**
 * @route   POST /api/conversations/:id/messages
 * @desc    Add a message to a conversation
 * @access  Private
 */
router.post('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                status: 'fail',
                message: 'Message content is required'
            });
        }

        // Verify user has access to this conversation
        const conversation = await Conversation.findById(id);

        if (!conversation) {
            return res.status(404).json({
                status: 'fail',
                message: 'Conversation not found'
            });
        }

        // Create message
        const message = await Message.create({
            conversation: id,
            sender: req.user.id,
            content: content
        });

        // Update conversation's last message
        conversation.lastMessage = content;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName email');

        res.status(201).json({
            status: 'success',
            data: { message: populatedMessage }
        });
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add message'
        });
    }
});

module.exports = router;
