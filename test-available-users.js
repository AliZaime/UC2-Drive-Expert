require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Agency = require('./models/Agency');
const Conversation = require('./models/Conversation');

const testGetAvailableUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const agencyId = '6970c9a63d2317dfda1bfc60';

    // Simulate the controller function
    const users = await User.find({ 
        agency: agencyId,
        role: { $in: ['manager', 'user'] }
    }).select('_id name email role').sort('_id');
    
    console.log(`Found ${users.length} users\n`);
    
    if (users.length === 0) {
        console.log('❌ No users found');
        process.exit(0);
    }

    users.forEach(u => {
        console.log(`User: ${u.name}`);
        console.log(`  Email: ${u.email}`);
        console.log(`  Role: ${u.role}`);
        console.log(`  ID: ${u._id}`);
        
        // Parse name
        const [firstName, ...lastNameParts] = (u.name || '').split(' ');
        const lastName = lastNameParts.join(' ') || '';
        console.log(`  Parsed: firstName="${firstName}", lastName="${lastName}"`);
        console.log('');
    });

    // Get user with least conversations
    const userLoads = {};
    users.forEach(u => {
        userLoads[u._id.toString()] = 0;
    });

    const conversations = await Conversation.find({
        agent: { $in: users.map(u => u._id) }
    }).select('agent');
    
    console.log(`Found ${conversations.length} conversations\n`);

    conversations.forEach(conv => {
        const agentId = conv.agent.toString();
        if (userLoads.hasOwnProperty(agentId)) {
            userLoads[agentId]++;
        }
    });

    // Find user with least conversations
    let selectedUser = users[0];
    let minLoad = userLoads[selectedUser._id.toString()];
    
    for (const user of users) {
        const load = userLoads[user._id.toString()];
        if (load < minLoad) {
            selectedUser = user;
            minLoad = load;
        }
    }

    console.log(`Selected user: ${selectedUser.name} (load: ${minLoad})`);
    
    const [firstName, ...lastNameParts] = (selectedUser.name || '').split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    console.log('\n✓ Would return:');
    console.log(JSON.stringify({
        status: 'success',
        data: [{
            id: selectedUser._id,
            firstName: firstName,
            lastName: lastName,
            email: selectedUser.email,
            role: selectedUser.role
        }]
    }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testGetAvailableUsers();
