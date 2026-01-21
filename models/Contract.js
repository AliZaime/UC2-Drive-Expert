const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    negotiation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Negotiation',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    type: {
        type: String,
        enum: ['Purchase', 'Trade-in', 'Lease', 'Subscription'],
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'signed', 'completed', 'cancelled'],
        default: 'draft'
    },
    terms: {
        price: Number,
        startDate: Date,
        durationMonths: Number,
        // ... other terms
    },
    documentUrl: String, 
    signatures: {
        client: {
            signed: { type: Boolean, default: false },
            signedAt: Date,
            ip: String
        },
        agency: {
            signed: { type: Boolean, default: false },
            signedAt: Date,
            agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
    }
}, {
    timestamps: true
});

const Contract = mongoose.model('Contract', contractSchema);
module.exports = Contract;
