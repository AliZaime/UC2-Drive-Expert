const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    unreadCount: {
        agent: { type: Number, default: 0 },
        client: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'closed'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Index for faster queries
conversationSchema.index({ agent: 1, status: 1 });
conversationSchema.index({ client: 1, status: 1 });
conversationSchema.index({ participants: 1 });

// Virtual for message count
conversationSchema.virtual('messages', {
    ref: 'Message',
    localField: '_id',
    foreignField: 'conversation'
});

module.exports = mongoose.model('Conversation', conversationSchema);
