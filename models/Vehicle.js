const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vin: {
        type: String,
        required: [true, 'A vehicle must have a VIN'],
        unique: true,
        trim: true
    },
    make: {
        type: String,
        required: [true, 'A vehicle must have a make']
    },
    model: {
        type: String,
        required: [true, 'A vehicle must have a model']
    },
    year: {
        type: Number,
        required: [true, 'A vehicle must have a year']
    },
    trim: String,
    mileage: {
        type: Number,
        required: [true, 'A vehicle must have mileage']
    },
    fuelType: {
        type: String,
        enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Plugin Hybrid'],
        required: true
    },
    transmission: {
        type: String,
        enum: ['Manual', 'Automatic'],
        required: true
    },
    color: String,
    
    price: {
        type: Number,
        required: [true, 'A vehicle must have a price']
    },
    marketValue: Number,
    
    status: {
        type: String,
        enum: ['available', 'reserved', 'sold', 'maintenance', 'incoming'],
        default: 'incoming'
    },
    
    agency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agency',
        required: [true, 'A vehicle must belong to an agency']
    },
    
    images: [String],
    
    features: [String],
    
    condition: {
        type: String,
        enum: ['New', 'Excellent', 'Good', 'Fair', 'Poor'],
        default: 'Good'
    },
    
    description: String,
    
    // For reserved/sold
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
