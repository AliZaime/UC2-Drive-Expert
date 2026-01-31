const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
require('dotenv').config();

const debugTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
        
        const email = 'test0123@gmail.com';

        console.log(`--- Searching User: ${email} ---`);
        const user = await User.findOne({ email });
        if (user) {
            console.log(`User Found: ID=${user._id}, Role=${user.role}, Agency=${user.agency}`);
        } else {
            console.log('User NOT found.');
        }

        console.log(`\n--- Searching Client: ${email} ---`);
        const client = await Client.findOne({ email });
        if (client) {
             console.log(`Client Found: ID=${client._id}`);
             console.log(`   UserLink: ${client.user}`);
             console.log(`   Agency: ${client.agency}`);
             console.log(`   AssignedAgent: ${client.assignedAgent}`);
             console.log(`   Status: ${client.status}`);
        } else {
            console.log('Client record NOT found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

debugTestUser();
