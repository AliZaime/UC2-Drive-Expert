const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
require('dotenv').config();

const debugAgencyMismatch = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Get the Agent
        const agent = await User.findOne({ email: 'agent@autouc2.com' });
        if (!agent) {
            console.log('CRITICAL: Agent user agent@autouc2.com NOT FOUND');
            return;
        }
        console.log(`\n🕵️ AGENT: ${agent.name}`);
        console.log(`   ID: ${agent._id}`);
        console.log(`   Agency ID: ${agent.agency}`);
        console.log(`   Role: ${agent.role}`);

        // 2. Get the Client "Jean Dupont"
        const client = await Client.findOne({ 
            $or: [{ firstName: /Jean/i, lastName: /Dupont/i }] 
        });

        if (!client) {
            console.log('\n❌ CLIENT "Jean Dupont" NOT FOUND in Client collection.');
        } else {
            console.log(`\n👤 CLIENT: ${client.firstName} ${client.lastName}`);
            console.log(`   ID: ${client._id}`);
            console.log(`   Agency ID: ${client.agency}`);
            console.log(`   Assigned Agent: ${client.assignedAgent}`);
            console.log(`   Status: ${client.status}`);
            
            // Compare
            if (agent.agency && client.agency) {
                if (agent.agency.toString() === client.agency.toString()) {
                    console.log('\n✅ Agency Match! Client SHOULD appear in list.');
                } else {
                    console.log('\n⛔ Agency MISMATCH! Client is in a different agency.');
                }
            } else {
                console.log('\n⚠️ One or both have undefined Agency.');
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

debugAgencyMismatch();
