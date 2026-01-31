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
    
    // User who created/added this vehicle
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Simplified Schema to match detailed user JSON
    costPrice: Number,

    specifications: {
        fuelType: String,
        transmission: String,
        color: String,
        doors: Number,
        seats: Number,
        engineSize: String,
        horsePower: Number
    },
    
    inventory: {
        location: String,
        daysInStock: Number
    },

    // Optional Images
    images: {
        type: [String],
        default: [],
        required: false
    },
    
    // Explicitly define Condition as string to accept French values "Neuf", "Très bon", etc. 
    // Or keep enum? User provided French values.
    // If we keep strict enum ['New', 'Good'...] we must map. 
    // User asked "re work model... to take THIS". implying we should support "Neuf" etc?
    // Let's relax the validation to allow strings or update enum if we want to support both.
    // Ideally we map, but for simplicity let's allow string first.
    condition: String, 
    
    status: {
        type: String,
        default: 'Disponible'
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
