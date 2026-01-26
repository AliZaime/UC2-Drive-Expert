const Client = require('../models/Client');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllClients = catchAsync(async (req, res, next) => {
    const clients = await Client.find();
    
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

    // Match on firstName, lastName, combined name, email, or phone
    const regex = new RegExp(query, 'i');
    const clients = await Client.find({
        $or: [
            { firstName: regex },
            { lastName: regex },
            { email: regex },
            { phone: regex },
            { fullName: regex }
        ]
    }).limit(50);

    res.status(200).json({
        status: 'success',
        results: clients.length,
        data: { clients }
    });
});

exports.createClient = catchAsync(async (req, res, next) => {
    // Auto-assign to current user if not specified
    if (!req.body.assignedAgent) req.body.assignedAgent = req.user.id;
    
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
