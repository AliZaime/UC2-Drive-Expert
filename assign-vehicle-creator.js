require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Agency = require('./models/Agency');

const assignVehicleCreator = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find the user
    const user = await User.findOne({ email: 'agent@autouc2.com' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`User: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`User ID: ${user._id}\n`);

    // Find all vehicles with the user's agency
    const vehicles = await Vehicle.find({ agency: user.agency });
    
    console.log(`Found ${vehicles.length} vehicle(s) with user's agency:\n`);

    let updated = 0;
    for (const vehicle of vehicles) {
      console.log(`- ${vehicle.make} ${vehicle.model} (VIN: ${vehicle.vin})`);
      console.log(`  Created By: ${vehicle.createdBy || 'NONE'}`);
      console.log(`  Added By: ${vehicle.addedBy || 'NONE'}`);
      
      // Update both fields
      vehicle.createdBy = user._id;
      vehicle.addedBy = user._id;
      await vehicle.save();
      
      console.log(`  ✅ Updated createdBy and addedBy to: ${user._id}\n`);
      updated++;
    }

    console.log(`✅ Successfully updated ${updated} vehicle(s)`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

assignVehicleCreator();
