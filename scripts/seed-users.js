require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

// Explicit list of users to seed
const usersToSeed = [
    {
        name: "Alex Rivers",
        email: "super@autouc2.com",
        password: "password123",
        confirmPassword: "password123",
        role: "superadmin",
        photo: "https://i.pravatar.cc/150?u=1",
        mfaEnabled: true
    },
    {
        name: "Sarah Connor",
        email: "admin@autouc2.com",
        password: "password123",
        confirmPassword: "password123",
        role: "admin",
        photo: "https://i.pravatar.cc/150?u=2",
        mfaEnabled: true
    },
    {
        name: "John Smith",
        email: "john@client.com",
        password: "password123",
        confirmPassword: "password123",
        role: "client",
        photo: "https://i.pravatar.cc/150?u=3",
        mfaEnabled: false
    },
    {
        name: "Mike Agent",
        email: "agent@autouc2.com",
        password: "password123",
        confirmPassword: "password123",
        role: "user", // "user" seems to correspond to "Agent" in the UI based on constants.tsx role mapping
        photo: "https://i.pravatar.cc/150?u=4",
        mfaEnabled: true
    }
];

const seedUsers = async () => {
    try {
        await connectDB();

        console.log('Starting seed process...');

        for (const userData of usersToSeed) {
            const existingUser = await User.findOne({ email: userData.email });
            
            if (existingUser) {
                console.log(`User ${userData.email} already exists. Skipping.`);
            } else {
                await User.create(userData);
                console.log(`User ${userData.email} created successfully.`);
            }
        }

        console.log('Seed process completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
