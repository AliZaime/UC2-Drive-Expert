const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    refreshTokenHash: {
        type: String,
        required: true,
        select: false
    },
    ipAddress: String,
    userAgent: String,
    deviceType: {
        type: String,
        enum: ['browser', 'mobile', 'kiosk'],
        default: 'browser'
    },
    kioskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Kiosk'
    },
    isValid: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
