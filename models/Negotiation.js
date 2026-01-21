const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'system', 'offer', 'document'],
        default: 'text'
    },
    readAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const offerSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'countered'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const negotiationSchema = new mongoose.Schema({
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    agency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agency',
        required: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // The commercial agent handling this
    },
    
    status: {
        type: String,
        enum: ['open', 'discussion', 'offer_sent', 'deal_reached', 'lost', 'cancelled'],
        default: 'open'
    },
    
    messages: [messageSchema],
    offers: [offerSchema],
    
    currentOffer: Number // Cache the latest active offer
    
}, {
    timestamps: true
});

const Negotiation = mongoose.model('Negotiation', negotiationSchema);

module.exports = Negotiation;
