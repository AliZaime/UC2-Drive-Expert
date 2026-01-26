const mongoose = require('mongoose');
require('dotenv').config();

const Conversation = require('./models/Conversation');
const User = require('./models/User');

async function debugUserConversations() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get the client user (John Smith)
        const client = await User.findOne({ email: 'john@client.com' });
        console.log('\n👤 Client User:');
        console.log(`   ID: ${client._id}`);
        console.log(`   Name: ${client.name}`);
        console.log(`   Email: ${client.email}`);

        // Get all conversations
        const allConversations = await Conversation.find({});
        console.log(`\n📊 All Conversations (${allConversations.length}):`);
        
        allConversations.forEach((conv, i) => {
            console.log(`\n${i + 1}. Conversation ${conv._id}:`);
            console.log(`   Client: ${conv.client}`);
            console.log(`   Agent: ${conv.agent}`);
            console.log(`   Participants: ${conv.participants}`);
            console.log(`   VehicleId: ${conv.vehicleId}`);
            console.log(`   Subject: ${conv.subject}`);
        });

        // Check what query would return
        console.log(`\n🔍 Querying conversations for user ${client._id}:`);
        const userConversations = await Conversation.find({
            $or: [
                { agent: client._id, status: { $ne: 'closed' } },
                { participants: client._id, status: { $ne: 'closed' } },
                { client: client._id, status: { $ne: 'closed' } }
            ]
        });
        
        console.log(`   Found: ${userConversations.length} conversations`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugUserConversations();
