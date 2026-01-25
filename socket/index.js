const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Store active users
const activeUsers = new Map();

const initializeSocket = (server) => {
    const io = socketIO(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true
        },
        pingTimeout: 60000,
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.userId}`);
        
        // Add user to active users
        activeUsers.set(socket.userId, socket.id);

        // Join user's personal room
        socket.join(`user:${socket.userId}`);

        // Emit online status to all conversations
        socket.broadcast.emit('user_online', { userId: socket.userId });

        /**
         * Join a conversation room
         */
        socket.on('join_conversation', async (data) => {
            try {
                const { conversationId } = data;
                
                // Verify user has access to this conversation
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: socket.userId
                });

                if (!conversation) {
                    return socket.emit('error', { message: 'Access denied to this conversation' });
                }

                // Join conversation room
                socket.join(`conversation:${conversationId}`);
                console.log(`User ${socket.userId} joined conversation ${conversationId}`);

                // Notify others in the conversation
                socket.to(`conversation:${conversationId}`).emit('user_joined', {
                    userId: socket.userId,
                    conversationId
                });
            } catch (error) {
                console.error('Error joining conversation:', error);
                socket.emit('error', { message: 'Failed to join conversation' });
            }
        });

        /**
         * Send a message
         */
        socket.on('send_message', async (data) => {
            try {
                const { conversationId, content } = data;

                // Verify access
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: socket.userId
                });

                if (!conversation) {
                    return socket.emit('error', { message: 'Access denied' });
                }

                // Create message
                const message = await Message.create({
                    conversation: conversationId,
                    sender: socket.userId,
                    content: content.trim()
                });

                // Populate sender info
                await message.populate('sender', 'name email');

                // Update unread count for other participant
                const otherParticipant = conversation.participants.find(
                    p => p.toString() !== socket.userId
                );
                
                if (socket.userId === conversation.agent.toString()) {
                    conversation.unreadCount.client += 1;
                } else {
                    conversation.unreadCount.agent += 1;
                }
                await conversation.save();

                // Emit to all users in the conversation
                io.to(`conversation:${conversationId}`).emit('new_message', {
                    message,
                    conversationId
                });

                // Emit notification to other participant if they're online
                const otherSocketId = activeUsers.get(otherParticipant.toString());
                if (otherSocketId) {
                    io.to(otherSocketId).emit('new_message_notification', {
                        conversationId,
                        message: message.content.substring(0, 50),
                        sender: message.sender.name
                    });
                }

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        /**
         * Typing indicator
         */
        socket.on('typing', (data) => {
            const { conversationId } = data;
            socket.to(`conversation:${conversationId}`).emit('user_typing', {
                userId: socket.userId,
                conversationId
            });
        });

        /**
         * Stop typing indicator
         */
        socket.on('stop_typing', (data) => {
            const { conversationId } = data;
            socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
                userId: socket.userId,
                conversationId
            });
        });

        /**
         * Mark messages as read
         */
        socket.on('mark_read', async (data) => {
            try {
                const { conversationId } = data;

                // Verify access
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: socket.userId
                });

                if (!conversation) {
                    return socket.emit('error', { message: 'Access denied' });
                }

                // Mark unread messages as read
                await Message.updateMany(
                    {
                        conversation: conversationId,
                        sender: { $ne: socket.userId },
                        read: false
                    },
                    {
                        read: true,
                        readAt: new Date()
                    }
                );

                // Reset unread count
                if (socket.userId === conversation.agent.toString()) {
                    conversation.unreadCount.agent = 0;
                } else {
                    conversation.unreadCount.client = 0;
                }
                await conversation.save();

                // Notify other participants
                socket.to(`conversation:${conversationId}`).emit('messages_read', {
                    conversationId,
                    readBy: socket.userId
                });

            } catch (error) {
                console.error('Error marking messages as read:', error);
                socket.emit('error', { message: 'Failed to mark messages as read' });
            }
        });

        /**
         * Disconnect
         */
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.userId}`);
            activeUsers.delete(socket.userId);
            
            // Notify all conversations
            socket.broadcast.emit('user_offline', { userId: socket.userId });
        });
    });

    return io;
};

module.exports = initializeSocket;
