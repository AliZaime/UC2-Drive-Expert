#!/usr/bin/env node

/**
 * Migration Script: Assign Agencies to Users
 * This script helps assign agencies to existing managers and commercial users
 * 
 * Usage: node scripts/assignAgenciesToUsers.js
 * 
 * Prerequisites:
 * - MongoDB connection configured in .env
 * - Managers and users exist in the database
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Agency = require('../models/Agency');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connection established');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

const assignAgenciesToManagers = async () => {
    try {
        console.log('\n📊 Starting manager-agency assignment...');
        
        // Get all agencies with their managers
        const agencies = await Agency.find().populate('manager');
        
        let assignedCount = 0;
        
        for (const agency of agencies) {
            if (agency.manager && agency.manager._id) {
                const result = await User.findByIdAndUpdate(
                    agency.manager._id,
                    { agency: agency._id },
                    { new: true, runValidators: false }
                );
                
                if (result) {
                    console.log(`✅ Assigned agency "${agency.name}" to manager "${result.name}"`);
                    assignedCount++;
                }
            }
        }
        
        console.log(`\n✅ Successfully assigned ${assignedCount} managers to their agencies`);
    } catch (error) {
        console.error('❌ Error assigning managers:', error);
    }
};

const assignAgenciesToCommercialUsers = async () => {
    try {
        console.log('\n📊 Starting commercial user-agency assignment...\n');
        
        // Get all agencies
        const agencies = await Agency.find();
        
        let totalAssigned = 0;
        
        for (const agency of agencies) {
            // Get manager of this agency to know who to assign users to
            const manager = await User.findOne({ _id: agency.manager, role: 'manager' });
            
            if (manager) {
                // Find all users (commercial) without an agency in this context
                // This is a safe assignment: users working for a specific manager should be in the same agency
                const usersWithoutAgency = await User.find({
                    role: 'user',
                    agency: { $exists: false }
                }).limit(10); // Limit to 10 at a time for safety
                
                // Manual assignment (admin should verify this)
                console.log(`\n📍 Agency: "${agency.name}"`);
                console.log(`   Manager: ${manager.name}`);
                console.log(`   Found ${usersWithoutAgency.length} users without agency assignment`);
            }
        }
        
        console.log('\n⚠️  Manual review required: Please assign users to their appropriate agencies');
        console.log('   Use: db.users.updateOne({_id: ObjectId("...")}, {$set: {agency: ObjectId("...")}})');
    } catch (error) {
        console.error('❌ Error assigning commercial users:', error);
    }
};

const verifyAssignments = async () => {
    try {
        console.log('\n📋 Verifying assignments...\n');
        
        const managers = await User.find({ role: 'manager', agency: { $exists: true } })
            .populate('agency', 'name');
        const managersWithoutAgency = await User.find({ role: 'manager', agency: { $exists: false } });
        
        const users = await User.find({ role: 'user', agency: { $exists: true } })
            .populate('agency', 'name');
        const usersWithoutAgency = await User.find({ role: 'user', agency: { $exists: false } });
        
        console.log(`Managers with agency: ${managers.length}`);
        managers.forEach(m => {
            console.log(`  ✅ ${m.name} -> ${m.agency?.name || 'N/A'}`);
        });
        
        console.log(`\nManagers without agency: ${managersWithoutAgency.length}`);
        managersWithoutAgency.forEach(m => {
            console.log(`  ❌ ${m.name}`);
        });
        
        console.log(`\nCommercial users with agency: ${users.length}`);
        console.log(`Commercial users without agency: ${usersWithoutAgency.length}`);
        
        if (usersWithoutAgency.length > 0) {
            console.log('\nUsers without agency:');
            usersWithoutAgency.forEach(u => {
                console.log(`  ❌ ${u.name} (${u.email})`);
            });
        }
    } catch (error) {
        console.error('❌ Error verifying assignments:', error);
    }
};

const main = async () => {
    await connectDB();
    
    console.log('\n🚀 Starting User-Agency Assignment Migration\n');
    console.log('This script will assign agencies to managers and commercial users\n');
    
    await assignAgenciesToManagers();
    await assignAgenciesToCommercialUsers();
    await verifyAssignments();
    
    console.log('\n✅ Migration process completed\n');
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed\n');
};

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
