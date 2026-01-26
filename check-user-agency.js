require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUserAgency() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find user by email
        const user = await User.findOne({ email: 'agent@autouc2.com' }).populate('agency');
        
        if (!user) {
            console.log('❌ User not found');
            process.exit(0);
        }

        console.log('\n=== USER INFO ===');
        console.log('Name:', user.name);
        console.log('Email:', user.email);
        console.log('Role:', user.role);
        console.log('Agency ID:', user.agency ? user.agency._id : 'NONE');
        
        if (user.agency) {
            console.log('\n=== AGENCY INFO ===');
            console.log('✅ User belongs to an agency:');
            console.log('Agency Name:', user.agency.name);
            console.log('Agency Status:', user.agency.status);
            if (user.agency.phone) console.log('Phone:', user.agency.phone);
            if (user.agency.email) console.log('Email:', user.agency.email);
        } else {
            console.log('\n❌ User does NOT belong to any agency');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkUserAgency();
