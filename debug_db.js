
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const latestVehicle = await Vehicle.findOne().sort({ createdAt: -1 });
        console.log("IMAGES ARRAY:", JSON.stringify(latestVehicle.images, null, 2));
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
