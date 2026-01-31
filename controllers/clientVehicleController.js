const Vehicle = require('../models/Vehicle');
const User = require('../models/User'); // Import User
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError'); // Import AppError

exports.getRecommendedVehicles = catchAsync(async (req, res, next) => {
    // Placeholder logic for recommendations
    // In real app, query based on user preferences in Client model
    const vehicles = await Vehicle.find({ status: 'available' }).limit(5);
    
    res.status(200).json({
        status: 'success',
        results: vehicles.length,
        data: { vehicles }
    });
});

exports.saveVehicleInterest = catchAsync(async (req, res, next) => {
    const vehicleId = req.params.id;
    
    if (!vehicleId) {
        return next(new AppError('Vehicle ID is required', 400));
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    
    // Ensure savedVehicles array is initialized
    if (!user.savedVehicles) user.savedVehicles = [];
    
    // Check if already saved using string comparison
    const isSaved = user.savedVehicles.some(id => id.toString() === vehicleId);
    let action = '';
    
    if (isSaved) {
        // Remove
        user.savedVehicles.pull(vehicleId);
        action = 'removed';
    } else {
        // Add
        user.savedVehicles.addToSet(vehicleId);
        action = 'added';
    }
    
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
        status: 'success',
        action,
        data: { savedVehicles: user.savedVehicles }
    });
});

exports.getSavedVehicles = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate({
        path: 'savedVehicles',
        populate: { path: 'agency' }
    });
    
    res.status(200).json({
        status: 'success',
        results: user.savedVehicles ? user.savedVehicles.length : 0,
        data: { vehicles: user.savedVehicles || [] }
    });
});
