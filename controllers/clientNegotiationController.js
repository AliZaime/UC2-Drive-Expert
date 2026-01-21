const Negotiation = require('../models/Negotiation');
const Client = require('../models/Client');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getMyNegotiations = catchAsync(async (req, res, next) => {
    const client = await Client.findOne({ user: req.user.id });
    if (!client) return res.status(200).json({ status: 'success', results: 0, data: { negotiations: [] } });

    const negotiations = await Negotiation.find({ client: client._id })
        .populate('vehicle', 'make model image')
        .sort('-updatedAt');
        
    res.status(200).json({
        status: 'success',
        results: negotiations.length,
        data: { negotiations }
    });
});

exports.startNegotiationResult = catchAsync(async (req, res, next) => {
    // Client requesting evaluation/negotiation
    // Should create a Negotiation (status: open/discussion)
    
     const client = await Client.findOne({ user: req.user.id });
     // Validation if client exists...

     const newNegotiation = await Negotiation.create({
         client: client._id,
         vehicle: req.body.vehicleId,
         agency: req.body.agencyId, // Need to fetch vehicle agency really
         status: 'discussion',
         messages: [{
             sender: req.user.id,
             content: req.body.initialMessage || 'I am interested in this vehicle.'
         }]
     });
     
     res.status(201).json({ status: 'success', data: { negotiation: newNegotiation } });
});
