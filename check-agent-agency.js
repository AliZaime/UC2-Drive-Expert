const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkAgentAgency = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const agent = await User.findOne({ email: 'agent@autouc2.com' });
        
        if (agent) {
             console.log(`Agent: ${agent.name}`);
             console.log(`Role: ${agent.role}`);
             console.log(`Agency: ${agent.agency}`); // Should be an ID
        } else {
             console.log('Agent not found');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

checkAgentAgency();
