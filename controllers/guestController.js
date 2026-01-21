const Vehicle = require('../models/Vehicle');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.browseVehicles = catchAsync(async (req, res, next) => {
    // Public browse, no auth required usually or minimal guest token
    const vehicles = await Vehicle.find({ status: 'available' });
    
    res.status(200).json({
        status: 'success',
        results: vehicles.length,
        data: { vehicles }
    });
});

exports.getVehicleDetails = catchAsync(async (req, res, next) => {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return next(new AppError('Vehicle not found', 404));
    
    res.status(200).json({ status: 'success', data: { vehicle } });
});
