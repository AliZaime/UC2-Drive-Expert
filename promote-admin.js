require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const promoteToAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to DB');

        // Update verify specific user
        const email = 'admin1@test.com'; // The latest one user tried
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ User ${email} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save({ validateBeforeSave: false });

        console.log(`🎉 Success! User ${email} is now an ADMIN.`);
        console.log('👉 Go back to Swagger, keep the SAME token, and try GET /admin/system/health again.');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

promoteToAdmin();
