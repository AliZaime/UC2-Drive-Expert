const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
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

const verify = async () => {
    await connectDB();
    
    try {
        // 1. Get a user
        const user = await User.findOne({ email: 'john@client.com' });
        if (!user) {
            console.log('Test user not found');
            return;
        }

        // 2. Get a vehicle
        const vehicle = await Vehicle.findOne();
        if (!vehicle) {
            console.log('No vehicles found');
            return;
        }

        console.log(`Testing with User: ${user.email} and Vehicle: ${vehicle._id}`);

        // 3. Simulate Toggle (Add)
        // Manual simulation of controller logic
        if (!user.savedVehicles) user.savedVehicles = [];
        let index = user.savedVehicles.indexOf(vehicle._id);
        
        if (index > -1) {
            user.savedVehicles.splice(index, 1);
            console.log('Removed vehicle');
        } else {
            user.savedVehicles.push(vehicle._id);
            console.log('Added vehicle');
        }
        await user.save({ validateBeforeSave: false });

        // 4. Verify Fetch
        const updatedUser = await User.findById(user._id).populate('savedVehicles');
        console.log(`Saved Vehicles Count: ${updatedUser.savedVehicles.length}`);
        console.log('Saved IDs:', updatedUser.savedVehicles.map(v => v._id));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
};

verify();
