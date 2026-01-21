const mongoose = require('mongoose');

const kioskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A kiosk must have a name/identifier'],
        unique: true
    },
    agency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agency',
        required: [true, 'A kiosk must belong to an agency']
    },
    status: {
        type: String,
        enum: ['active', 'offline', 'maintenance', 'disabled'],
        default: 'active'
    },
    deviceInfo: {
        os: String,
        version: String,
        ipAddress: String,
        macAddress: String,
        lastHeartbeat: Date
    },
    config: {
        allowedModes: {
            type: [String],
            default: ['browse', 'check-in', 'video-call']
        },
        printerEnabled: { type: Boolean, default: true }
    },
    currentSession: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session'
    }
}, {
    timestamps: true
});

const Kiosk = mongoose.model('Kiosk', kioskSchema);

module.exports = Kiosk;
