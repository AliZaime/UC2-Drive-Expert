const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Agency = require('./models/Agency');
require('dotenv').config();

const importVehicles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 Connected to DB');
        
        console.log('🗑️ Clearing Database...');
        await Vehicle.deleteMany({});
        await Conversation.deleteMany({});
        await Message.deleteMany({}); // Ensure messages are cleared
        console.log('✅ Database Cleared (Vehicles, Conversations, Messages)');

        // Load sample data
        // Path relative to execution root: 
        // c:\Users\aliza\.gemini\antigravity\brain\74b25022-6212-4210-8eb0-a4245ddb21cc\vehicle_reference.json
        // We will just copy-paste the content logic or require it if path allows.
        // It's in a hidden folder, requiring might be tricky with relative paths.
        // I will embed the JSON content directly here for robustness, or read securely.
        // Actually, requiring an absolute path works in Node.
        
        const sampleVehicles = require('c:/Users/aliza/.gemini/antigravity/brain/74b25022-6212-4210-8eb0-a4245ddb21cc/vehicle_reference.json');

        // Find a default agency to assign these vehicles to
        // We'll pick the first available agency
        const defaultAgency = await Agency.findOne();
        let agencyId = defaultAgency ? defaultAgency._id : null;
        
        if (!agencyId) {
             console.log('⚠️ No Agency found. Creating a default one.');
             const newAgency = await Agency.create({
                 name: "Agence Principale",
                 email: "contact@agence.com",
                 address: { city: "Casablanca" }
             });
             agencyId = newAgency._id;
        }

        console.log(`🚗 Importing ${sampleVehicles.length} Vehicles to Agency ${agencyId}...`);

        const vehicles = sampleVehicles.map((v, index) => ({
            ...v,
            id: undefined,
            agency: agencyId,
            vin: `VF1${v.make.substring(0,2).toUpperCase()}${v.model.substring(0,3).toUpperCase()}00${(1000 + index).toString()}`,
            // Map Root Fields required by older frontend code if they still exist in schema?
            // Current schema Step 721 had root `fuelType`, `transmission` required.
            // I should REMOVE those requirements from Schema if I want to use only nested.
            // But to be safe, I will map them as well.
            fuelType: mapFuelType(v.specifications.fuelType),
            transmission: mapTransmission(v.specifications.transmission),
            
            // Condition: Pass value as is (Schema updated to String)
            condition: v.condition 
        }));

        const createdVehicles = await Vehicle.insertMany(vehicles);
        console.log(`✅ Imported ${createdVehicles.length} vehicles.`);
        
        process.exit();
    } catch (error) {
        console.error('❌ Import Failed:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`- Error in ${key}: ${error.errors[key].message}`);
                console.error(`  Value: ${error.errors[key].value}`);
            });
        }
        process.exit(1);
    }
};

function mapCondition(frenchCondition) {
    const map = {
        'Neuf': 'New',
        'Excellent': 'Excellent',
        'Très bon': 'Good', // "Good" is closest to "Très bon" in English enum usually, or Excellent?
        'Bon': 'Good',
        'Moyen': 'Fair',
        'Mauvais': 'Poor'
    };
    return map[frenchCondition] || 'Good';
}

function mapFuelType(frenchFuel) {
    const map = {
        'Essence': 'Petrol',
        'Diesel': 'Diesel',
        'Électrique': 'Electric',
        'Hybride': 'Hybrid',
        'Hybride Rechargeable': 'Plugin Hybrid'
    }; 
    return map[frenchFuel] || 'Petrol';
}

function mapTransmission(frenchTrans) {
    const map = {
        'Manuelle': 'Manual',
        'Automatique': 'Automatic'
    };
    return map[frenchTrans] || 'Manual';
}

importVehicles();
