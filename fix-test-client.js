const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
require('dotenv').config();

const fixTestClient = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const email = 'test0123@gmail.com';
        const user = await User.findOne({ email });
        const agent = await User.findOne({ email: 'agent@autouc2.com' });

        if (!user || !agent) {
            console.log('User or Agent not found.');
            return;
        }

        const existingClient = await Client.findOne({ email });
        if (existingClient) {
            console.log('Client already exists.');
            return;
        }

        console.log(`Creating Client for ${email}...`);
        
        const nameParts = user.name ? user.name.split(' ') : ['Client', 'Test'];
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';

        const newClient = await Client.create({
            user: user._id,
            firstName: firstName,
            lastName: lastName,
            email: email,
            assignedAgent: agent._id,
            agency: agent.agency,
            status: 'Lead' // or 'Active'
        });

        console.log('✅ Client created:', newClient._id);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

fixTestClient();
