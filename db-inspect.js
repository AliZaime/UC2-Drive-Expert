require('dotenv').config();
const mongoose = require('mongoose');

const inspectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas');

        const collections = await mongoose.connection.db.listCollections().toArray();

        console.log('\n📊 Database Collections & Counts:');
        console.log('---------------------------------');

        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`📂 ${col.name.padEnd(20)}: ${count} documents`);
        }

        console.log('\n🔍 Check for specific admins:');
        const admin = await mongoose.connection.db.collection('users').findOne({ email: 'admin@test.com' });
        const admin1 = await mongoose.connection.db.collection('users').findOne({ email: 'admin1@test.com' });
        
        console.log('admin@test.com exists?', !!admin, admin ? `(ID: ${admin._id})` : '');
        console.log('admin1@test.com exists?', !!admin1, admin1 ? `(ID: ${admin1._id})` : '');

        console.log('\n👤 All Users List (Email - Role):');
        const users = await mongoose.connection.db.collection('users').find().toArray();
        users.forEach(u => console.log(`- ${u.email.padEnd(35)} [${u.role}]`));

        console.log('\n---------------------------------');
        process.exit();
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

inspectDB();
