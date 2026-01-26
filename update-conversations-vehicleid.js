const mongoose = require('mongoose');
require('dotenv').config();

const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

async function updateConversations() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get all conversations
        const conversations = await Conversation.find({});
        console.log(`📊 Found ${conversations.length} conversations`);

        for (const conv of conversations) {
            console.log(`\n🔍 Conversation ${conv._id}:`);
            console.log(`   Subject: ${conv.subject}`);
            console.log(`   VehicleId: ${conv.vehicleId}`);
            
            // If no vehicleId, try to extract from subject
            if (!conv.vehicleId && conv.subject) {
                // Check messages for vehicle reference
                const messages = await Message.find({ conversation: conv._id }).limit(5);
                console.log(`   Messages count: ${messages.length}`);
                
                // For now, just log - we'll need to manually check
                console.log(`   ⚠️ No vehicleId - needs manual update`);
            } else if (conv.vehicleId) {
                console.log(`   ✅ Has vehicleId: ${conv.vehicleId}`);
            }
        }

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateConversations();
