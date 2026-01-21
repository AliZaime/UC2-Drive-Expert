const Kiosk = require('../models/Kiosk');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.registerDevice = catchAsync(async (req, res, next) => {
    // Initial setup of a kiosk
    const newKiosk = await Kiosk.create(req.body);
    
    res.status(201).json({ status: 'success', data: { kiosk: newKiosk } });
});

exports.heartbeat = catchAsync(async (req, res, next) => {
    // Kiosk pings this every minute
    // Identify kiosk by token or ID (middleware should handle auth)
    // For now assuming ID in params or body
    
    const kiosk = await Kiosk.findOneAndUpdate(
        { _id: req.body.kioskId }, // or req.user.id if authenticated as kiosk
        { 'deviceInfo.lastHeartbeat': Date.now() },
        { new: true }
    );
    
    res.status(200).json({ status: 'success', status: 'online' });
});

exports.getConfig = catchAsync(async (req, res, next) => {
    // Fetch remote config
    const kiosk = await Kiosk.findById(req.params.id);
    res.status(200).json({ status: 'success', data: { config: kiosk.config } });
});
