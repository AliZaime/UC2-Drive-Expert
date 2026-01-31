const mongoose = require('mongoose');
const Client = require('./models/Client');
require('dotenv').config();

const cleanUp = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const result = await Client.deleteOne({ email: 'agent@autouc2.com' });
        
        if (result.deletedCount > 0) {
            console.log('Successfully deleted Client record for agent@autouc2.com');
        } else {
            console.log('No Client record found to delete.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

cleanUp();
