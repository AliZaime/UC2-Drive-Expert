const Client = require('../models/Client');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const User = require('../models/User'); // Import User model

exports.getAllClients = catchAsync(async (req, res, next) => {
    let filter = {};

    // Filter by agency for non-superadmins
    if (req.user.role !== 'superadmin' && req.user.agency) {
        filter.agency = req.user.agency;
    } else if (req.user.role === 'user' && !req.user.agency) {
         // If a regular user has no agency, they should probably only see clients assigned to them
         filter.assignedAgent = req.user.id;
    }

    const clients = await Client.find(filter);
    
    res.status(200).json({
        status: 'success',
        results: clients.length,
        data: { clients }
    });
});

// Search clients by name or contact
exports.searchClients = catchAsync(async (req, res, next) => {
    let { query } = req.query;

    if (typeof query === 'string') {
        query = query.trim();
    }

    if (!query || query.length === 0) {
        return next(new AppError('Search query is required', 400));
    }

    // Build filter based on agency access
    let filter = {};
    if (req.user.role !== 'superadmin' && req.user.agency) {
        filter.agency = req.user.agency;
    }

    // Match on firstName, lastName, combined name, email, or phone
    const regex = new RegExp(query, 'i');
    filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { fullName: regex }
    ];

    const clients = await Client.find(filter).limit(50);

    res.status(200).json({
        status: 'success',
        results: clients.length,
        data: { clients }
    });
});

exports.createClient = catchAsync(async (req, res, next) => {
    // Auto-assign to current user if not specified
    if (!req.body.assignedAgent) req.body.assignedAgent = req.user.id;
    // Auto-assign to current user's agency if not specified
    if (!req.body.agency && req.user.agency) req.body.agency = req.user.agency;
    
    // Check if a User already exists with this email
    let user = await User.findOne({ email: req.body.email });

    if (!user) {
        // Create new User account for this client
        console.log(`Creating new user account for client: ${req.body.email}`);
        user = await User.create({
            name: `${req.body.firstName} ${req.body.lastName}`,
            email: req.body.email,
            password: 'password123',
            confirmPassword: 'password123',
            role: 'client',
            agency: req.body.agency // optional: link user to agency? maybe not strictly required for client role
        });
    }

    // Link Client record to User
    req.body.user = user._id;

    const newClient = await Client.create(req.body);
    
    res.status(201).json({
        status: 'success',
        data: { client: newClient }
    });
});

exports.getClient = catchAsync(async (req, res, next) => {
    const client = await Client.findById(req.params.id).populate('assignedAgent', 'name');
    
    if (!client) {
        return next(new AppError('No client found with that ID', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { client }
    });
});

exports.updateClient = catchAsync(async (req, res, next) => {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    
    if (!client) {
        return next(new AppError('No client found with that ID', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { client }
    });
});

exports.addNote = catchAsync(async (req, res, next) => {
    const client = await Client.findById(req.params.id);
    if (!client) return next(new AppError('Client not found', 404));
    
    client.notes.push({
        text: req.body.text,
        author: req.user.id
    });
    await client.save();
    
    res.status(200).json({ status: 'success', data: { client } });
});
