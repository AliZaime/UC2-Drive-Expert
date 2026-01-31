const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkUserRole = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'alli@gmail.com' }); // Check exact email from user prompt
        // Note: User said "alli@gmail.com", screenshot says "ali@gmail.com". I'll check both just in case.
        const user2 = await User.findOne({ email: 'ali@gmail.com' });

        if (user) console.log(`alli@gmail.com: ${user.role} (ID: ${user._id})`);
        else console.log('alli@gmail.com not found');

        if (user2) console.log(`ali@gmail.com: ${user2.role} (ID: ${user2._id})`);
        else console.log('ali@gmail.com not found');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

checkUserRole();
