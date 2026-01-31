const mongoose = require('mongoose');
const Client = require('./models/Client');
const User = require('./models/User');
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

const checkClient = async () => {
    await connectDB();
    
    try {
        // Find the user John
        const user = await User.findOne({ email: 'john@client.com' });
        if (!user) {
            console.log('User john@client.com NOT FOUND.');
            return;
        }
        console.log(`User John found: ${user._id} (Role: ${user.role})`);

        // Check for Client records linked to this user
        const clients = await Client.find({ user: user._id }).populate('agency');
        
        if (clients.length === 0) {
            console.log('NO Client records found for this user.');
        } else {
            console.log(`Found ${clients.length} Client records:`);
            clients.forEach(c => {
                console.log(`- Agency: ${c.agency ? c.agency.name : 'None'} (${c.agency ? c.agency._id : 'N/A'})`);
                console.log(`  Assigned Agent: ${c.assignedAgent}`);
                console.log(`  Status: ${c.status}`);
            });
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
};

checkClient();
