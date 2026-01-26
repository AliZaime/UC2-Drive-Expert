const mongoose = require('mongoose');
require('dotenv').config();

const Conversation = require('./models/Conversation');
const Vehicle = require('./models/Vehicle');

async function assignVehicleIds() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get all vehicles
        const vehicles = await Vehicle.find({});
        console.log(`\n📊 Available Vehicles:`);
        vehicles.forEach((v, i) => {
            console.log(`${i + 1}. ${v.make} ${v.model} - ID: ${v._id}`);
        });

        // Get conversations
        const conversations = await Conversation.find({});
        console.log(`\n📊 Found ${conversations.length} conversations\n`);

        if (conversations.length > 0 && vehicles.length >= 2) {
            // Assign BMW to first conversation
            const bmw = vehicles.find(v => v.make === 'BMW');
            const audi = vehicles.find(v => v.make === 'Audi');

            console.log(`\n🔧 Updating conversations:`);
            
            for (let i = 0; i < conversations.length; i++) {
                const conv = conversations[i];
                let vehicle = i === 0 ? bmw : (i === 1 ? audi : bmw);
                
                if (vehicle) {
                    conv.vehicleId = vehicle._id;
                    conv.subject = `Intéressé par ${vehicle.make} ${vehicle.model}`;
                    await conv.save();
                    console.log(`✅ Conv ${i + 1}: Assigned ${vehicle.make} ${vehicle.model} (${vehicle._id})`);
                }
            }

            console.log('\n✅ All conversations updated!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

assignVehicleIds();
