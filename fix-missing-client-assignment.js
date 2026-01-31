const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
require('dotenv').config();

const fixAssignment = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Get Agent
        const agent = await User.findOne({ email: 'agent@autouc2.com' });
        if (!agent) {
             console.log('Agent not found');
             return;
        }

        // 2. Get Client
        const client = await Client.findOne({ 
            $or: [{ firstName: /Jean/i, lastName: /Dupont/i }] 
        });

        if (!client) {
             console.log('Client Jean Dupont not found');
             return;
        }

        console.log(`Fixing Client: ${client.firstName} ${client.lastName}`);
        
        // Update Assignment
        client.assignedAgent = agent._id;
        console.log(`-> Set Assigned Agent to: ${agent.name} (${agent._id})`);

        // Update Agency (if agent has one, otherwise clear it or keep it?)
        // If agent has agency, client must have it to be seen.
        if (agent.agency) {
            client.agency = agent.agency;
            console.log(`-> Set Agency to: ${agent.agency}`);
        } else {
            console.log(`-> Agent has no agency. Client assigned directly.`);
            // If agent has no agency, the controller filters by assignedAgent, which we just set.
        }

        await client.save();
        console.log('✅ Client updated successfully.');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

fixAssignment();
