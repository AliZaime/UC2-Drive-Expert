const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // Optional: A client might not have a login account yet (just a lead)
        // If they register, we link them.
    },
    firstName: {
        type: String,
        required: [true, 'A client must have a first name']
    },
    lastName: {
        type: String,
        required: [true, 'A client must have a last name']
    },
    email: {
        type: String,
        required: [true, 'A client must have an email'],
        unique: true
    },
    phone: String,
    
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    agency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agency'
    },
    
    status: {
        type: String,
        enum: ['Lead', 'Prospect', 'Active', 'Inactive', 'Customer'],
        default: 'Lead'
    },
    
    tags: [String],
    notes: [{
        text: String,
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    }],
    
    preferences: {
        budget: { min: Number, max: Number },
        vehicleTypes: [String]
    }

}, {
    timestamps: true
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
