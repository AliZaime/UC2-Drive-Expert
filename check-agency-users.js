require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Agency = require('./models/Agency');

const checkAgencyUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const agencyId = '6970c9a63d2317dfda1bfc60';

    // Check agency exists
    const agency = await Agency.findById(agencyId);
    if (!agency) {
      console.log('❌ Agency not found');
      process.exit(1);
    }

    console.log(`✓ Agency found: ${agency.name}\n`);

    // Get all users
    const allUsers = await User.find().select('_id firstName lastName email agency role');
    console.log(`Total users in DB: ${allUsers.length}\n`);

    // Get users with this agency
    const agencyUsers = await User.find({ agency: agencyId }).select('_id firstName lastName email role');
    console.log(`Users with agency ${agencyId}: ${agencyUsers.length}\n`);

    if (agencyUsers.length > 0) {
      console.log('Users in agency:');
      agencyUsers.forEach(u => {
        console.log(`  - ${u.firstName} ${u.lastName} (${u.email}) [${u.role}]`);
      });
    } else {
      console.log('No users found with this agency ID');
    }

    // Get users with manager/user role
    const staffUsers = await User.find({ 
      agency: agencyId,
      role: { $in: ['manager', 'user'] }
    }).select('_id firstName lastName email role');
    
    console.log(`\nStaff users (manager/user role): ${staffUsers.length}\n`);
    
    if (staffUsers.length > 0) {
      console.log('Staff in agency:');
      staffUsers.forEach(u => {
        console.log(`  - ${u.firstName} ${u.lastName} (${u.email}) [${u.role}]`);
      });
    } else {
      console.log('No staff users found with manager/user role');
    }

    // Show sample users with agencies
    console.log('\n--- Sample users with agencies ---');
    const sampleUsers = await User.find().select('_id firstName lastName email agency role').limit(5);
    sampleUsers.forEach(u => {
      console.log(`${u.firstName} ${u.lastName}: agency=${u.agency}, role=${u.role}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAgencyUsers();
