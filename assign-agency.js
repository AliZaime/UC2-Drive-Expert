require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Agency = require('./models/Agency');

async function assignAgency() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Find user
        const user = await User.findOne({ email: 'agent@autouc2.com' });
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log('User found:', user.name, '(' + user.email + ')');
        console.log('Current agency:', user.agency || 'NONE');
        console.log('\n=== Available Agencies ===\n');

        // List agencies
        const agencies = await Agency.find();
        agencies.forEach((agency, index) => {
            console.log(`${index + 1}. ${agency.name} (ID: ${agency._id})`);
        });

        // Assign first agency by default (you can change the index)
        const agencyToAssign = agencies[0]; // First agency
        
        console.log(`\n✅ Assigning agency: ${agencyToAssign.name}\n`);

        user.agency = agencyToAssign._id;
        await user.save({ validateBeforeSave: false });

        console.log('✅ Agency assigned successfully!');
        console.log(`User ${user.name} is now part of ${agencyToAssign.name}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

assignAgency();
