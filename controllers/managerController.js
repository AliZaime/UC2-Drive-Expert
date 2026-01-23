const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Client = require('../models/Client');
const Negotiation = require('../models/Negotiation');
const Contract = require('../models/Contract');
const Agency = require('../models/Agency');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * Get manager dashboard with agency-specific statistics
 */
exports.getManagerDashboard = catchAsync(async (req, res, next) => {
    // Get the agency of the manager
    const manager = await User.findById(req.user.id).select('agency');
    
    if (!manager.agency) {
        return next(new AppError('Manager is not assigned to any agency', 400));
    }

    const agencyId = manager.agency;

    // Get statistics for the agency
    const [
        totalVehicles,
        availableVehicles,
        totalEmployees,
        activeNegotiations,
        totalClients,
        monthlyContracts
    ] = await Promise.all([
        Vehicle.countDocuments({ agency: agencyId }),
        Vehicle.countDocuments({ agency: agencyId, status: 'available' }),
        User.countDocuments({ agency: agencyId, role: 'user' }),
        Negotiation.countDocuments({ agency: agencyId, status: { $in: ['open', 'discussion', 'offer_sent'] } }),
        Client.countDocuments({ agency: agencyId }),
        Contract.countDocuments({
            agency: agencyId,
            createdAt: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
        })
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            agencyId,
            statistics: {
                totalVehicles,
                availableVehicles,
                totalEmployees,
                activeNegotiations,
                totalClients,
                monthlyContracts
            }
        }
    });
});

/**
 * Get all employees (users) of the manager's agency
 */
exports.getAgencyEmployees = catchAsync(async (req, res, next) => {
    const manager = await User.findById(req.user.id).select('agency');
    
    if (!manager.agency) {
        return next(new AppError('Manager is not assigned to any agency', 400));
    }

    const employees = await User.find({
        agency: manager.agency,
        role: 'user',
        active: true
    }).select('-password -mfaSecret');

    res.status(200).json({
        status: 'success',
        results: employees.length,
        data: {
            employees
        }
    });
});

/**
 * Create a new employee (user) in the manager's agency
 */
exports.createEmployee = catchAsync(async (req, res, next) => {
    const manager = await User.findById(req.user.id).select('agency');
    
    if (!manager.agency) {
        return next(new AppError('Manager is not assigned to any agency', 400));
    }

    // Only allow creating users with role 'user'
    const newEmployee = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        role: 'user',
        agency: manager.agency
    });

    // Remove password from output
    newEmployee.password = undefined;

    res.status(201).json({
        status: 'success',
        data: {
            employee: newEmployee
        }
    });
});

/**
 * Update an employee of the manager's agency
 */
exports.updateEmployee = catchAsync(async (req, res, next) => {
    const manager = await User.findById(req.user.id).select('agency');
    
    if (!manager.agency) {
        return next(new AppError('Manager is not assigned to any agency', 400));
    }

    // Check if the employee belongs to the manager's agency
    const employee = await User.findOne({
        _id: req.params.id,
        agency: manager.agency,
        role: 'user'
    });

    if (!employee) {
        return next(new AppError('Employee not found in your agency', 404));
    }

    // Don't allow changing role or agency
    const allowedFields = ['name', 'email', 'active', 'photo'];
    const updates = {};
    
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    const updatedEmployee = await User.findByIdAndUpdate(
        req.params.id,
        updates,
        {
            new: true,
            runValidators: true
        }
    ).select('-password -mfaSecret');

    res.status(200).json({
        status: 'success',
        data: {
            employee: updatedEmployee
        }
    });
});

/**
 * Delete (deactivate) an employee
 */
exports.deleteEmployee = catchAsync(async (req, res, next) => {
    const manager = await User.findById(req.user.id).select('agency');
    
    if (!manager.agency) {
        return next(new AppError('Manager is not assigned to any agency', 400));
    }

    // Check if the employee belongs to the manager's agency
    const employee = await User.findOne({
        _id: req.params.id,
        agency: manager.agency,
        role: 'user'
    });

    if (!employee) {
        return next(new AppError('Employee not found in your agency', 404));
    }

    await User.findByIdAndUpdate(req.params.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

/**
 * Get all vehicles of the manager's agency
 */
exports.getAgencyVehicles = catchAsync(async (req, res, next) => {
    const manager = await User.findById(req.user.id).select('agency');
    
    if (!manager.agency) {
        return next(new AppError('Manager is not assigned to any agency', 400));
    }

    const vehicles = await Vehicle.find({ agency: manager.agency });

    res.status(200).json({
        status: 'success',
        results: vehicles.length,
        data: {
            vehicles
        }
    });
});

/**
 * Get all clients of the manager's agency
 */
exports.getAgencyClients = catchAsync(async (req, res, next) => {
    const manager = await User.findById(req.user.id).select('agency');
    
    if (!manager.agency) {
        return next(new AppError('Manager is not assigned to any agency', 400));
    }

    const clients = await Client.find({ agency: manager.agency })
        .populate('assignedAgent', 'name email');

    res.status(200).json({
        status: 'success',
        results: clients.length,
        data: {
            clients
        }
    });
});

/**
 * Get all negotiations of the manager's agency
 */
exports.getAgencyNegotiations = catchAsync(async (req, res, next) => {
    const manager = await User.findById(req.user.id).select('agency');
    
    if (!manager.agency) {
        return next(new AppError('Manager is not assigned to any agency', 400));
    }

    const negotiations = await Negotiation.find({ agency: manager.agency })
        .populate('vehicle', 'make model year price')
        .populate('client', 'firstName lastName email')
        .populate('agent', 'name email');

    res.status(200).json({
        status: 'success',
        results: negotiations.length,
        data: {
            negotiations
        }
    });
});

/**
 * Get analytics for the manager's agency
 */
exports.getAgencyAnalytics = catchAsync(async (req, res, next) => {
    const manager = await User.findById(req.user.id).select('agency');
    
    if (!manager.agency) {
        return next(new AppError('Manager is not assigned to any agency', 400));
    }

    const agencyId = manager.agency;

    // Get sales data
    const salesData = await Contract.aggregate([
        {
            $match: {
                agency: agencyId,
                status: 'completed'
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: '$amount' }
            }
        },
        {
            $sort: { '_id.year': -1, '_id.month': -1 }
        },
        {
            $limit: 12
        }
    ]);

    // Get employee performance
    const employeePerformance = await Contract.aggregate([
        {
            $match: {
                agency: agencyId,
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$agent',
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: '$amount' }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'agentInfo'
            }
        },
        {
            $unwind: '$agentInfo'
        },
        {
            $project: {
                agentName: '$agentInfo.name',
                totalSales: 1,
                totalRevenue: 1
            }
        },
        {
            $sort: { totalSales: -1 }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            salesData,
            employeePerformance
        }
    });
});

/**
 * Get agency information
 */
exports.getAgencyInfo = catchAsync(async (req, res, next) => {
    const manager = await User.findById(req.user.id).select('agency');
    
    if (!manager.agency) {
        return next(new AppError('Manager is not assigned to any agency', 400));
    }

    const agency = await Agency.findById(manager.agency);

    if (!agency) {
        return next(new AppError('Agency not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            agency
        }
    });
});

/**
 * Update agency information (limited fields)
 */
exports.updateAgencyInfo = catchAsync(async (req, res, next) => {
    const manager = await User.findById(req.user.id).select('agency');
    
    if (!manager.agency) {
        return next(new AppError('Manager is not assigned to any agency', 400));
    }

    // Only allow updating certain fields
    const allowedFields = ['phone', 'email', 'config'];
    const updates = {};
    
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    const agency = await Agency.findByIdAndUpdate(
        manager.agency,
        updates,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: 'success',
        data: {
            agency
        }
    });
});
