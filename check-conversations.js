require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const Client = require('./models/Client');
const Message = require('./models/Message');

const checkConversations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find all conversations
    const allConversations = await Conversation.find()
      .populate('client', 'name email')
      .populate('agent', 'name email')
      .populate('participants', 'name email');
    
    console.log(`Total conversations in DB: ${allConversations.length}\n`);

    if (allConversations.length > 0) {
      allConversations.forEach((conv, i) => {
        console.log(`${i + 1}. Conversation ID: ${conv._id}`);
        console.log(`   Status: ${conv.status}`);
        console.log(`   Client: ${conv.client?.name || 'N/A'}`);
        console.log(`   Agent: ${conv.agent?.name || 'N/A'}`);
        console.log(`   Participants: ${conv.participants?.map(p => p.name).join(', ') || 'N/A'}`);
        console.log(`   Last Message: ${conv.lastMessage || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No conversations found');
    }

    // Check messages
    const messages = await Message.find()
      .populate('sender', 'name email');
    
    console.log(`\nTotal messages in DB: ${messages.length}`);
    if (messages.length > 0) {
      messages.forEach((msg, i) => {
        console.log(`${i + 1}. Message: ${msg.content?.substring(0, 50)}...`);
        console.log(`   Sender: ${msg.sender?.name || 'N/A'}`);
        console.log(`   Conversation: ${msg.conversation}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkConversations();
