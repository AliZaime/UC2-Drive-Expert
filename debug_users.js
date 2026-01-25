const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
        
        const users = await User.find({}).select('+role +email +name');
        const fs = require('fs');
        let output = `Users found: ${users.length}\n`;
        users.forEach(u => {
            output += `- ${u.name} (${u.email}) : [${u.role}] ID:${u._id}\n`;
        });
        fs.writeFileSync('users_list.txt', output);
        console.log("Written to users_list.txt");

        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
