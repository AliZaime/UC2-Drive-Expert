const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: [true, 'A message must belong to a conversation'],
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A message must have a sender']
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [5000, 'Message cannot exceed 5000 characters']
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    type: {
        type: String,
        enum: ['text', 'system', 'offer'],
        default: 'text'
    },
    fileUrl: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Index for faster queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

// Update conversation's lastMessage when a new message is created
messageSchema.post('save', async function() {
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(this.conversation, {
        lastMessage: this.content.substring(0, 100),
        lastMessageAt: this.createdAt
    });
});

module.exports = mongoose.model('Message', messageSchema);
