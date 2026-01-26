const Agency = require('../models/Agency');
const Kiosk = require('../models/Kiosk');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// --- Agencies ---

exports.getAllAgencies = catchAsync(async (req, res, next) => {
    const agencies = await Agency.find().populate('manager', 'name email');
    
    res.status(200).json({
        status: 'success',
        results: agencies.length,
        data: { agencies }
    });
});

exports.createAgency = catchAsync(async (req, res, next) => {
    const newAgency = await Agency.create(req.body);
    
    res.status(201).json({
        status: 'success',
        data: { agency: newAgency }
    });
});

exports.getAgency = catchAsync(async (req, res, next) => {
    const agency = await Agency.findById(req.params.id).populate('kiosks');
    
    if (!agency) {
        return next(new AppError('No agency found with that ID', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { agency }
    });
});

exports.updateAgency = catchAsync(async (req, res, next) => {
    const agency = await Agency.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    
    if (!agency) {
        return next(new AppError('No agency found with that ID', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { agency }
    });
});

exports.deleteAgency = catchAsync(async (req, res, next) => {
    const agency = await Agency.findByIdAndDelete(req.params.id);
    
    if (!agency) {
        return next(new AppError('No agency found with that ID', 404));
    }
    
    res.status(204).json({
        status: 'success',
        data: null
    });
});

// --- Kiosks (Nested under Agency) ---

exports.getAgencyKiosks = catchAsync(async (req, res, next) => {
    // If nested route GET /agencies/:id/kiosks
    const kiosks = await Kiosk.find({ agency: req.params.id });
    
    res.status(200).json({
        status: 'success',
        results: kiosks.length,
        data: { kiosks }
    });
});

exports.createAgencyKiosk = catchAsync(async (req, res, next) => {
    // If nested route POST /agencies/:id/kiosks
    if (!req.body.agency) req.body.agency = req.params.id;
    
    const newKiosk = await Kiosk.create(req.body);
    
    res.status(201).json({
        status: 'success',
        data: { kiosk: newKiosk }
    });
});

// Get next available user from agency using round-robin (for client contact)
exports.getAgencyAvailableUsers = catchAsync(async (req, res, next) => {
    const { id: agencyId } = req.params;
    
    const User = require('../models/User');
    
    // Get all users in this agency (managers and staff only)
    const users = await User.find({ 
        agency: agencyId,
        role: { $in: ['manager', 'user'] } // Only managers and staff
    }).select('_id name email role').sort('_id');
    
    if (!users || users.length === 0) {
        return res.status(200).json({
            status: 'success',
            data: []
        });
    }
    
    // If only one user, return them
    if (users.length === 1) {
        const user = users[0];
        const [firstName, ...lastNameParts] = (user.name || '').split(' ');
        const lastName = lastNameParts.join(' ') || '';
        
        return res.status(200).json({
            status: 'success',
            data: [{
                id: user._id,
                firstName: firstName,
                lastName: lastName,
                email: user.email,
                role: user.role
            }]
        });
    }
    
    // Round-robin: get user with least conversations
    const Conversation = require('../models/Conversation');
    const userLoads = {};
    
    // Initialize load for each user
    users.forEach(u => {
        userLoads[u._id.toString()] = 0;
    });
    
    // Count conversations per user
    const conversations = await Conversation.find({
        agent: { $in: users.map(u => u._id) }
    }).select('agent');
    
    conversations.forEach(conv => {
        const agentId = conv.agent.toString();
        if (userLoads.hasOwnProperty(agentId)) {
            userLoads[agentId]++;
        }
    });
    
    // Find user with least conversations (round-robin load balancing)
    let selectedUser = users[0];
    let minLoad = userLoads[selectedUser._id.toString()];
    
    for (const user of users) {
        const load = userLoads[user._id.toString()];
        if (load < minLoad) {
            selectedUser = user;
            minLoad = load;
        }
    }
    
    const [firstName, ...lastNameParts] = (selectedUser.name || '').split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    res.status(200).json({
        status: 'success',
        data: [{
            id: selectedUser._id,
            firstName: firstName,
            lastName: lastName,
            email: selectedUser.email,
            role: selectedUser.role
        }]
    });
});
