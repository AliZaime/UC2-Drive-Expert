require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Agency = require('./models/Agency');

const updateVehicleAgency = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find the user
    const user = await User.findOne({ email: 'agent@autouc2.com' }).populate('agency');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    if (!user.agency) {
      console.log('❌ User has no agency assigned');
      process.exit(1);
    }

    console.log(`User: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Agency: ${user.agency.name} (ID: ${user.agency._id})\n`);

    // Find vehicles created by this user
    const vehicles = await Vehicle.find({ createdBy: user._id });
    
    if (vehicles.length === 0) {
      console.log('❌ No vehicles found for this user');
      process.exit(0);
    }

    console.log(`Found ${vehicles.length} vehicle(s) created by this user:\n`);

    // Update each vehicle with the user's agency
    for (const vehicle of vehicles) {
      console.log(`- ${vehicle.make} ${vehicle.model} (VIN: ${vehicle.vin})`);
      console.log(`  Current agency: ${vehicle.agency || 'NONE'}`);
      
      vehicle.agency = user.agency._id;
      await vehicle.save();
      
      console.log(`  ✅ Updated to agency: ${user.agency.name}\n`);
    }

    console.log(`✅ Successfully updated ${vehicles.length} vehicle(s) with agency: ${user.agency.name}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateVehicleAgency();
