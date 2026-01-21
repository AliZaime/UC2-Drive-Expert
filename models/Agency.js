const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'An agency must have a name'],
        unique: true,
        trim: true
    },
    address: {
        street: String,
        city: String,
        zip: String,
        country: String,
        country: String
    },
    location: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number], // [longitude, latitude]
        formattedAddress: String
    },
    phone: String,
    email: String,
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
    },
    config: {
        timezone: { type: String, default: 'UTC' },
        currency: { type: String, default: 'EUR' }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual populate for kiosks
agencySchema.virtual('kiosks', {
    ref: 'Kiosk',
    foreignField: 'agency',
    localField: '_id'
});

agencySchema.index({ location: '2dsphere' });

const Agency = mongoose.model('Agency', agencySchema);

module.exports = Agency;
