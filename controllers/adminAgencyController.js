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
