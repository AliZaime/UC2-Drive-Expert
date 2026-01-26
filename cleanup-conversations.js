const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupConversations() {
  try {
    // Connect to MongoDB directly
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get all conversations
    const conversations = await db.collection('conversations').find({}).toArray();
    console.log(`\n📊 Found ${conversations.length} conversations total:\n`);
    
    conversations.forEach((conv, idx) => {
      console.log(`${idx + 1}. ID: ${conv._id}`);
      console.log(`   Client: ${conv.client}`);
      console.log(`   Agent: ${conv.agent}`);
      console.log(`   Vehicle: ${conv.vehicleId || 'None'}`);
      console.log(`   Subject: ${conv.subject || 'None'}\n`);
    });

    // Delete all conversations and messages
    const msgDelete = await db.collection('messages').deleteMany({});
    const convDelete = await db.collection('conversations').deleteMany({});
    
    console.log(`\n✅ Deleted ${msgDelete.deletedCount} messages`);
    console.log(`✅ Deleted ${convDelete.deletedCount} conversations`);
    console.log('\n🔄 Database cleaned! Start fresh by creating new conversations.\n');

    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanupConversations();

