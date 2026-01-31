const express = require('express');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Client = require('../models/Client');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find all conversations where user is a participant
        const conversations = await Conversation.find({
            participants: userId,
            status: { $ne: 'archived' } // Exclude archived conversations
        })
        .populate('participants', 'name email role')
        .populate('vehicleId', 'make model year price')
        .sort({ updatedAt: -1 })
        .lean();
        
        res.status(200).json({
            status: 'success',
            results: conversations.length,
            conversations
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
 * @route   POST /api/conversations
 * @desc    Create or get existing conversation with a client
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        const { clientId, participantIds, vehicleId, subject } = req.body;
        
        // Support both old format (clientId + agent) and new format (participantIds)
        let client, agent, conversationParticipants;
        

        // Resolve clientId to User ID if it's a Client document ID
        if (clientId) {
            // const Client = require('../models/Client'); // Moved to top
            // Check if this is a Client document ID
            // We use findById. If it finds a Client, we use that Client's linked User ID.
            if (mongoose.Types.ObjectId.isValid(clientId)) {
                const clientDoc = await Client.findById(clientId);
                if (clientDoc && clientDoc.user) {
                    console.log(`🔄 Resolved Client ID ${clientId} to User ID ${clientDoc.user}`);
                    clientId = clientDoc.user; // Update clientId to be the User ID
                } else if (clientDoc && !clientDoc.user) {
                    console.warn(`⚠️ Client ${clientId} found but has no linked User account`);
                    // If we can't find a user, we might want to error or handle it.
                    // For now, let's proceed, but it might fail schema validation or populate.
                }
            }
        }

        if (participantIds && participantIds.length >= 2) {
            // New format: array of participant IDs
            conversationParticipants = participantIds;
            // First participant is client, second is agent/user
            client = participantIds[0];
            agent = participantIds[1];

            // --- FIX: Check if agent is actually an Agency ID ---
            // The frontend sometimes passes agencyId instead of a User ID
            // We need to resolve this to a valid User (e.g., the agency manager)
            const Agency = require('../models/Agency');
            const potentialAgency = await Agency.findById(agent);
            
            if (potentialAgency) {
                console.log(`⚠️ Detected Agency ID instead of User ID. Resolving to manager...`);
                if (potentialAgency.manager) {
                    agent = potentialAgency.manager;
                    conversationParticipants[1] = agent; // Update the array
                    console.log(`✅ Resolved to manager: ${agent}`);
                } else {
                    // Fallback: find any user from this agency
                    const agencyUser = await User.findOne({ agency: potentialAgency._id, role: { $in: ['user', 'admin'] } });
                    if (agencyUser) {
                        agent = agencyUser._id;
                        conversationParticipants[1] = agent;
                        console.log(`✅ Resolved to agency user: ${agent}`);
                    } else {
                        return res.status(400).json({
                            status: 'fail',
                            message: 'No valid agent found for this agency'
                        });
                    }
                }
            }
            // -----------------------------------------------
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



// ... imports

        // Check if conversation already exists (with vehicle-specific lookup)
        let conversation;
        
        // --- AUTO-LINK CLIENT TO AGENCY LOGIC ---
        // If the creator is a client (or user acting as client), ensure they are linked to the agency
        if ((req.user.role === 'client' || req.user.role === 'user') && agent) {
            try {
                // Find the agent's agency
                // We need to fetch the agent User to get their agencyId
                const agentUser = await User.findById(agent);
                
                if (agentUser && agentUser.agency) {
                    const agencyId = agentUser.agency;
                    
                    // Check if client record exists for this agency
                    const existingClient = await Client.findOne({ 
                        user: req.user.id, 
                        agency: agencyId 
                    });
                    
                    if (!existingClient) {
                         console.log(`🔗 Auto-linking client ${req.user.email} to agency ${agencyId}`);
                         await Client.create({
                             user: req.user.id,
                             firstName: req.user.name ? req.user.name.split(' ')[0] : 'Client',
                             lastName: req.user.name ? req.user.name.split(' ').slice(1).join(' ') || 'Name' : 'Unknown',
                             email: req.user.email,
                             agency: agencyId,
                             assignedAgent: agent,
                             status: 'Lead',
                             phone: '', // User model might not have phone, leave empty or fetch if available
                             notes: [{ text: 'Auto-created via contact request', author: agent }]
                         });
                    }
                }
            } catch (err) {
                console.error('Error auto-linking client:', err);
                // Don't block conversation creation if this fails
            }
        }
        // ----------------------------------------

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
                    status: 'active',
                    isAiNegotiation: req.body.isAiNegotiation || false  // Support AI negotiations
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
 * @route   DELETE /api/conversations/:id
 * @desc    Delete a conversation and all its messages
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verify user has access to this conversation
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

        // Delete all messages in this conversation
        const deletedMessages = await Message.deleteMany({ conversation: id });
        console.log(`🗑️ Deleted ${deletedMessages.deletedCount} message(s) from conversation ${id}`);

        // Delete the conversation
        await Conversation.findByIdAndDelete(id);
        console.log(`🗑️ Deleted conversation ${id}`);

        res.status(200).json({
            status: 'success',
            message: 'Conversation deleted successfully',
            data: {
                deletedMessages: deletedMessages.deletedCount
            }
        });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete conversation'
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

        // --- AI INTEGRATION FOR REST API ---
        const isAIConversation = conversation.subject?.startsWith('[IA]') || conversation.isAiNegotiation;

        let aiMessage = null;
        
        if (isAIConversation) {
            console.log(`🤖 [REST] AI Conversation detected! Processing...`);
            
            // Lazy load dependencies
            const AIService = require('../services/AIService');
            const socketIO = require('../utils/socket');
            const Vehicle = require('../models/Vehicle');
            
            // AI Bot User ID (created by scripts/create-ai-bot.js)
            const mongoose = require('mongoose');
            const AI_BOT_ID = new mongoose.Types.ObjectId(process.env.AI_BOT_USER_ID || '697d62074715f889ac90dd94');

            // Fetch vehicle data from MongoDB
            let vehicleContext = null;
            if (conversation.vehicleId) {
                try {
                    const vehicle = await Vehicle.findById(conversation.vehicleId);
                    if (vehicle) {
                        vehicleContext = {
                            id: vehicle._id.toString(),
                            make: vehicle.make,
                            model: vehicle.model,
                            year: vehicle.year,
                            price: vehicle.price,
                            mileage: vehicle.mileage,
                            condition: vehicle.condition,
                            features: vehicle.features || [],
                            specifications: vehicle.specifications || {}
                        };
                        console.log(`📊 [REST] Vehicle data loaded:`, vehicleContext.make, vehicleContext.model);
                    }
                } catch (err) {
                    console.error('Error fetching vehicle data:', err);
                }
            }

            // Fetch history for context (last 10 messages)
            const historyMessages = await Message.find({ conversation: id })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('sender');
            
            const history = historyMessages.reverse().map(msg => ({
                speaker: msg.sender._id.toString() === conversation.client.toString() ? 'customer' : 'agent',
                message: msg.content
            }));
            
            // AWAIT AI Response (synchronous)
            try {
                // FETCH THE LATEST OFFER FROM HISTORY to maintain continuity
                const lastOfferMessage = [...historyMessages].reverse().find(m => m.metadata && m.metadata.offer);
                let currentOffer = null;

                if (lastOfferMessage) {
                    currentOffer = lastOfferMessage.metadata.offer;
                    console.log(`🔄 [REST] Using existing offer from history: ${currentOffer.price} MAD`);
                } else {
                    // Initial offer from vehicle price
                    currentOffer = {
                        price: vehicleContext?.price || 0,
                        vehicle_price: vehicleContext?.price || 0,
                        monthly: vehicleContext?.price ? Math.round(vehicleContext.price / 60) : 0,
                        duration: 60
                    };
                    console.log(`🆕 [REST] Starting new negotiation with base price: ${currentOffer.price} MAD`);
                }
                
                const aiResponse = await AIService.negotiate({
                    sessionId: id.toString(),
                    customerMessage: content,
                    history: history,
                    vehicle_context: vehicleContext,
                    currentOffer: currentOffer  // Pass current offer to maintain state
                });
                
                if (aiResponse && aiResponse.agent_message) {
                    console.log(`🤖 [REST] AI Response received. Current price: ${aiResponse.new_offer?.price || 'N/A'}`);
                    
                    // Create AI Reply with BOT user as sender
                    aiMessage = await Message.create({
                        conversation: id,
                        sender: AI_BOT_ID,
                        content: aiResponse.agent_message,
                        metadata: {
                            ai_analysis: aiResponse.emotional_analysis,
                            intent: aiResponse.intent_detected,
                            offer: aiResponse.new_offer, // Persist the offer here!
                            reasoning: aiResponse.reasoning,
                            win_win_score: aiResponse.win_win_score
                        }
                    });
                    await aiMessage.populate('sender', 'firstName lastName email');

                    conversation.lastMessage = aiResponse.agent_message.substring(0, 50);
                    conversation.lastMessageAt = new Date();
                    conversation.unreadCount.client += 1;
                    
                    // Check if negotiation is finalized (accepted or rejected)
                    const intent = aiResponse.intent_detected?.toLowerCase() || '';
                    if (intent === 'accept' || intent === 'deal_closed') {
                        conversation.status = 'closed';
                        conversation.negotiationStatus = 'accepted';
                        console.log(`✅ Negotiation ACCEPTED - Conversation closed`);
                    } else if (intent === 'reject' || intent === 'walkaway') {
                        conversation.status = 'closed';
                        conversation.negotiationStatus = 'rejected';
                        console.log(`❌ Negotiation REJECTED - Conversation closed`);
                    }
                    
                    await conversation.save();

                    // Emit via Socket for real-time updates
                    const io = socketIO.getIO();
                    if (io) {
                        io.to(`conversation:${id}`).emit('new_message', {
                            message: aiMessage,
                            conversationId: id
                        });
                        
                        if (aiResponse.emotional_analysis) {
                            io.to(`conversation:${id}`).emit('ai_metrics_update', {
                                conversationId: id,
                                metrics: {
                                    sentiment: aiResponse.emotional_analysis.sentiment_score,
                                    emotion: aiResponse.emotional_analysis.primary_emotion,
                                    keyPoints: aiResponse.emotional_analysis.key_concerns || [],
                                    intent: aiResponse.intent_detected,
                                    analysis: aiResponse.agent_steps ? aiResponse.agent_steps.map(s => `> ${s.action}: ${s.reasoning || 'OK'}`) : []
                                }
                            });
                        }
                    }
                }
            } catch (aiError) {
                console.error('AI Negotiation failed:', aiError);
                // Fallback: create a generic AI message
                aiMessage = await Message.create({
                    conversation: id,
                    sender: AI_BOT_ID,
                    content: "Je rencontre actuellement des difficultés techniques pour analyser votre demande. Un agent humain va prendre le relais."
                });
                await aiMessage.populate('sender', 'firstName lastName email');
            }
        }

        // Return BOTH user message and AI message in response
        res.status(201).json({
            status: 'success',
            data: { 
                message: populatedMessage,
                aiMessage: aiMessage // Include AI response if available
            }
        });
        // -----------------------------------
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add message'
        });
    }
});

module.exports = router;
