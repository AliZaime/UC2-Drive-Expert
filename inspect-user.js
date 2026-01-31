const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const inspectUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const user = await User.findOne({ email: 'agent@autouc2.com' });
        if (user) {
            console.log('User found:');
            console.log('Name:', user.name);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('ID:', user._id);
        } else {
            console.log('User agent@autouc2.com not found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

inspectUser();
