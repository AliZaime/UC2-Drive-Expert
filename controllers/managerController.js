const User = require('../models/User');
const Agency = require('../models/Agency');
const Vehicle = require('../models/Vehicle');
const Client = require('../models/Client');
const Negotiation = require('../models/Negotiation'); // Assuming model exists
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// -- My Custom Methods (aliased later if needed) --
exports.getMyAgents = catchAsync(async (req, res, next) => {
    // Ensure user has agency
    if (!req.user.agency) {
        return next(new AppError('You do not belong to an agency.', 403));
    }

    const agents = await User.find({
        agency: req.user.agency,
        role: 'user' // Only list agents
    }).select('-password');

    res.status(200).json({
        status: 'success',
        results: agents.length,
        data: { agents }
    });
});

exports.createAgent = catchAsync(async (req, res, next) => {
    // Ensure user has agency
    if (!req.user.agency) {
        return next(new AppError('You do not belong to an agency.', 403));
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('Email already in use.', 400));
    }

    const newAgent = await User.create({
        name,
        email,
        password,
        confirmPassword: password,
        role: 'user',
        agency: req.user.agency
    });

    newAgent.password = undefined;

    res.status(201).json({
        status: 'success',
        data: { agent: newAgent }
    });
});

// -- Methods required by managerRoutes.js --

exports.getManagerDashboard = catchAsync(async (req, res, next) => {
    if (!req.user.agency) return next(new AppError('No agency assigned', 400));
    
    // Basic stats
    const vehicleCount = await Vehicle.countDocuments({ agency: req.user.agency });
    const agentCount = await User.countDocuments({ agency: req.user.agency, role: 'user' });
    const clientCount = await Client.countDocuments({ agency: req.user.agency });
    
    res.status(200).json({
        status: 'success',
        data: {
            agencyId: req.user.agency,
            statistics: {
                totalVehicles: vehicleCount,
                availableVehicles: vehicleCount, // Simplify for now
                totalEmployees: agentCount,
                activeNegotiations: 0, 
                totalClients: clientCount,
                monthlyContracts: 0
            }
        }
    });
});

exports.getAgencyInfo = catchAsync(async (req, res, next) => {
    if (!req.user.agency) return next(new AppError('No agency assigned', 400));
    
    // If Agency model exists
    // const agency = await Agency.findById(req.user.agency);
    // For now returning mock or minimal info if model fails
    res.status(200).json({
        status: 'success',
        data: { id: req.user.agency, name: "Your Agency" }
    });
});

exports.updateAgencyInfo = catchAsync(async (req, res, next) => {
    res.status(200).json({ status: 'success', message: 'Not implemented yet' });
});

// Map employees to agents
exports.getAgencyEmployees = exports.getMyAgents; 
exports.createEmployee = exports.createAgent;

exports.updateEmployee = catchAsync(async (req, res, next) => {
    res.status(200).json({ status: 'success', message: 'Not implemented yet' });
});

exports.deleteEmployee = catchAsync(async (req, res, next) => {
     // Implement soft delete or delete
     const { id } = req.params;
     // Check permissions?
     await User.findByIdAndDelete(id); 
     res.status(204).json({ status: 'success', data: null });
});

exports.getAgencyVehicles = catchAsync(async (req, res, next) => {
    if (!req.user.agency) return next(new AppError('No agency assigned', 400));
    const vehicles = await Vehicle.find({ agency: req.user.agency });
    res.status(200).json({
        status: 'success',
        results: vehicles.length,
        data: { vehicles }
    });
});

exports.getAgencyClients = catchAsync(async (req, res, next) => {
    if (!req.user.agency) return next(new AppError('No agency assigned', 400));
    const clients = await Client.find({ agency: req.user.agency });
    res.status(200).json({
        status: 'success',
        results: clients.length,
        data: { clients }
    });
});

exports.getAgencyNegotiations = catchAsync(async (req, res, next) => {
    res.status(200).json({ status: 'success', results: 0, data: { negotiations: [] } });
});

exports.getAgencyAnalytics = catchAsync(async (req, res, next) => {
     res.status(200).json({ status: 'success', data: { salesData: [], employeePerformance: [] } });
});
