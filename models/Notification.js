const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    data: {
        type: Object, // Link to entity { negotiationId: ..., vehicleId: ... }
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d' // Auto delete after 30 days
    }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
