require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Agency = require('./models/Agency');

const syncVehicleAgency = async () => {
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
    console.log(`User's Agency ID: ${user.agency}\n`);

    // Find all vehicles
    const vehicles = await Vehicle.find({}).populate('agency');
    
    console.log(`Found ${vehicles.length} vehicle(s) in database:\n`);

    let updated = 0;
    for (const vehicle of vehicles) {
      console.log(`- ${vehicle.make} ${vehicle.model} (VIN: ${vehicle.vin})`);
      console.log(`  Current agency: ${vehicle.agency ? vehicle.agency.name : 'NONE'} (${vehicle.agency?._id || 'NONE'})`);
      
      if (vehicle.agency?._id.toString() !== user.agency.toString()) {
        vehicle.agency = user.agency;
        await vehicle.save();
        console.log(`  ✅ Updated to user's agency\n`);
        updated++;
      } else {
        console.log(`  ✓ Already has user's agency\n`);
      }
    }

    if (updated > 0) {
      console.log(`✅ Successfully updated ${updated} vehicle(s)`);
    } else {
      console.log(`✓ All vehicles already have the correct agency`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

syncVehicleAgency();
