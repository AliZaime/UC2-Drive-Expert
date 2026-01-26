require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');

const findVehicles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const vehicles = await Vehicle.find({}).limit(5);
    
    console.log(`Found ${vehicles.length} vehicles in database:\n`);
    
    vehicles.forEach((v, i) => {
      console.log(`${i + 1}. ${v.make} ${v.model} (${v.year})`);
      console.log(`   VIN: ${v.vin}`);
      console.log(`   Status: ${v.status}`);
      console.log(`   Agency: ${v.agency ? v.agency.toString() : 'NONE'}`);
      console.log(`   Created By: ${v.createdBy ? v.createdBy.toString() : 'NONE'}`);
      console.log(`   Added By: ${v.addedBy ? v.addedBy.toString() : 'NONE'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

findVehicles();
