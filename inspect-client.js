const mongoose = require('mongoose');
const Client = require('./models/Client');
require('dotenv').config();

const inspectClient = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const client = await Client.findOne({ email: 'agent@autouc2.com' });
        if (client) {
            console.log('Client record found:');
            console.log('ID:', client._id);
            console.log('Name:', client.firstName, client.lastName);
            console.log('Email:', client.email);
            console.log('Status:', client.status);
            console.log('Linked User ID:', client.user);
        } else {
            console.log('Client record for agent@autouc2.com not found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

inspectClient();
