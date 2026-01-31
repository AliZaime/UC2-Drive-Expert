const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
require('dotenv').config();

const debugMissingClient = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const nameRegex = /Jean Dupont/i;

        console.log('--- Searching in USERS ---');
        const users = await User.find({ name: nameRegex });
        if (users.length > 0) {
            users.forEach(u => {
                console.log(`User Found: ID=${u._id}, Name=${u.name}, Email=${u.email}, Role=${u.role}, Agency=${u.agency}`);
            });
        } else {
            console.log('No User found with name matching "Jean Dupont"');
        }

        console.log('\n--- Searching in CLIENTS ---');
        const clients = await Client.find({ 
            $or: [
                { firstName: /Jean/i, lastName: /Dupont/i },
                { fullName: nameRegex } // Assuming virtual or some schema field might store full name, but standard is first/last
            ]
        });
        
        if (clients.length > 0) {
            clients.forEach(c => {
                console.log(`Client Found: ID=${c._id}, Name=${c.firstName} ${c.lastName}, Email=${c.email}, Status=${c.status}, Agency=${c.agency}, UserLink=${c.user}`);
            });
        } else {
            console.log('No Client record found for "Jean Dupont"');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

debugMissingClient();
