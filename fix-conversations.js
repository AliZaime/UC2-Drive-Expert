const mongoose = require('mongoose');
const Conversation = require('./models/Conversation');
const Client = require('./models/Client');
const User = require('./models/User');
require('dotenv').config();

const fixConversations = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const conversations = await Conversation.find();
        console.log(`Checking ${conversations.length} conversations...`);

        for (const conv of conversations) {
            // Check if client is a valid User
            const user = await User.findById(conv.client);
            
            if (!user) {
                console.log(`⚠️ Conversation ${conv._id} has invalid User ID: ${conv.client}`);
                
                // Try to find if this ID is a Client document
                const clientDoc = await Client.findById(conv.client);
                
                if (clientDoc) {
                    console.log(`   ✅ Found matching Client document: ${clientDoc.firstName} ${clientDoc.lastName}`);
                    
                    if (clientDoc.user) {
                         console.log(`   🔄 Updating Conversation client to User ID: ${clientDoc.user}`);
                         conv.client = clientDoc.user;
                         
                         // Update participants array if it contains the Client ID
                         const newParticipants = conv.participants.map(p => 
                             p.toString() === clientDoc._id.toString() ? clientDoc.user : p
                         );
                         // Ensure User ID is in participants
                         if (!newParticipants.some(p => p.toString() === clientDoc.user.toString())) {
                             newParticipants.push(clientDoc.user);
                         }
                         conv.participants = newParticipants;
                         
                         await conv.save();
                    } else {
                        console.log(`   ❌ Client document exists but has no linked User.`);
                        // Create user? Maybe too risky for a script.
                         console.log(`   🛠 Creating user for orphan client...`);
                         try {
                              const newUser = await User.create({
                                    name: `${clientDoc.firstName} ${clientDoc.lastName}`,
                                    email: clientDoc.email,
                                    password: 'password123', // Default password
                                    confirmPassword: 'password123',
                                    role: 'client',
                                    agency: clientDoc.agency
                              });
                              clientDoc.user = newUser._id;
                              await clientDoc.save();
                              
                              conv.client = newUser._id;
                              // Update participants
                              const newParts = conv.participants.map(p => 
                                 p.toString() === clientDoc._id.toString() ? newUser._id : p
                              );
                              if (!newParts.some(p => p.toString() === newUser._id.toString())) {
                                  newParts.push(newUser._id);
                              }
                              conv.participants = newParts;
                              
                              await conv.save();
                              console.log(`   ✨ Created User and linked!`);
                         } catch (err) {
                             console.error(`   Fail to create user:`, err.message);
                         }
                    }
                } else {
                    console.log(`   ❌ ID ${conv.client} is neither User nor Client.`);
                }
            }
        }
        
        console.log('Done.');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

fixConversations();
