const mongoose = require('mongoose');
const User = require('./models/User');
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

const checkUser = async () => {
    await connectDB();
    
    try {
        const user = await User.findOne({ email: 'agent@autouc2.com' }).populate('agency');
        
        if (!user) {
            console.log('User not found');
        } else {
            console.log('User Found:');
            console.log(`Name: ${user.name}`);
            console.log(`Email: ${user.email}`);
            console.log(`Role: ${user.role}`);
            
            if (user.agency) {
                console.log('--- AGENCY ---');
                console.log(`Agency Name: ${user.agency.name}`);
                console.log(`Agency ID: ${user.agency._id}`);
            } else {
                console.log('--- NO AGENCY ASSIGNED ---');
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
};

checkUser();
