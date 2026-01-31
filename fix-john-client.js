const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
const Agency = require('./models/Agency');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const fixClient = async () => {
    await connectDB();
    
    try {
        // 1. Get John
        const john = await User.findOne({ email: 'john@client.com' });
        if (!john) {
            console.log('John not found');
            return;
        }

        // 2. Get Agent
        const agent = await User.findOne({ email: 'agent@autouc2.com' });
        if (!agent || !agent.agency) {
            console.log('Agent or Agent Agency not found');
            return;
        }

        // 3. Create Client Record
        const existing = await Client.findOne({ user: john._id, agency: agent.agency });
        if (existing) {
            console.log('Client record already exists.');
        } else {
            const newClient = await Client.create({
                user: john._id,
                firstName: john.name ? john.name.split(' ')[0] : 'John',
                lastName: john.name ? john.name.split(' ').slice(1).join(' ') || 'Doe' : 'Client',
                email: john.email,
                agency: agent.agency,
                assignedAgent: agent._id,
                status: 'Prospect', // Set as Prospect since they contacted
                notes: [{ text: 'Manually fixed via script after contact', author: agent._id }]
            });
            console.log('✅ Client record created successfully for John linked to Agency.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
};

fixClient();
