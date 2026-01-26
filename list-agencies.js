require('dotenv').config();
const mongoose = require('mongoose');
const Agency = require('./models/Agency');

async function listAgencies() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        const agencies = await Agency.find().populate('manager', 'name email');
        
        if (agencies.length === 0) {
            console.log('❌ No agencies found in database');
            process.exit(0);
        }

        console.log(`✅ Found ${agencies.length} agencies:\n`);
        
        agencies.forEach((agency, index) => {
            console.log(`${index + 1}. ${agency.name}`);
            console.log(`   ID: ${agency._id}`);
            console.log(`   Status: ${agency.status}`);
            if (agency.phone) console.log(`   Phone: ${agency.phone}`);
            if (agency.email) console.log(`   Email: ${agency.email}`);
            if (agency.manager) {
                console.log(`   Manager: ${agency.manager.name} (${agency.manager.email})`);
            }
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

listAgencies();
