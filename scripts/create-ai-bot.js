require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const createAIBot = async () => {
    try {
        await connectDB();

        console.log('Checking for AI Bot user...');

        const existingBot = await User.findOne({ email: 'ai-bot@autouc2.system' });
        
        if (existingBot) {
            console.log('✅ AI Bot already exists:', existingBot._id);
            console.log('Bot ID:', existingBot._id.toString());
            process.exit(0);
        }

        const aiBot = await User.create({
            name: 'IA Négociation',
            email: 'ai-bot@autouc2.system',
            password: 'SYSTEM_BOT_NO_LOGIN',
            confirmPassword: 'SYSTEM_BOT_NO_LOGIN',
            role: 'user', // Using 'user' role but this is a special system user
            photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai-bot',
            mfaEnabled: false
        });

        console.log('✅ AI Bot created successfully!');
        console.log('Bot ID:', aiBot._id.toString());
        console.log('\n⚠️ IMPORTANT: Add this to your .env file:');
        console.log(`AI_BOT_USER_ID=${aiBot._id.toString()}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating AI Bot:', error);
        process.exit(1);
    }
};

createAIBot();
