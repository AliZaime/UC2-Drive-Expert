require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const connectDB = require('../config/db');

const cleanupAIConversations = async () => {
    try {
        await connectDB();

        console.log('🧹 Cleaning up old AI conversations...');

        // Find all AI conversations (marked by [IA] in subject or isAiNegotiation flag)
        const aiConversations = await Conversation.find({
            $or: [
                { subject: { $regex: /^\[IA\]/ } },
                { isAiNegotiation: true }
            ]
        });

        console.log(`Found ${aiConversations.length} AI conversation(s) to delete.`);

        if (aiConversations.length === 0) {
            console.log('✅ No AI conversations to clean up.');
            process.exit(0);
        }

        // Delete messages for each conversation
        for (const conv of aiConversations) {
            const deletedMessages = await Message.deleteMany({ conversation: conv._id });
            console.log(`  - Deleted ${deletedMessages.deletedCount} message(s) from conversation ${conv._id}`);
        }

        // Delete conversations
        const result = await Conversation.deleteMany({
            $or: [
                { subject: { $regex: /^\[IA\]/ } },
                { isAiNegotiation: true }
            ]
        });

        console.log(`✅ Deleted ${result.deletedCount} AI conversation(s) successfully.`);
        console.log('\n🎯 You can now create a fresh AI conversation for testing!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning up AI conversations:', error);
        process.exit(1);
    }
};

cleanupAIConversations();
