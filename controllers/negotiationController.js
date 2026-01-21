const Negotiation = require('../models/Negotiation');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllNegotiations = catchAsync(async (req, res, next) => {
    const negotiations = await Negotiation.find()
        .populate('vehicle', 'make model vin')
        .populate('client', 'firstName lastName');
        
    res.status(200).json({
        status: 'success',
        results: negotiations.length,
        data: { negotiations }
    });
});

exports.createNegotiation = catchAsync(async (req, res, next) => {
    if (!req.body.agent) req.body.agent = req.user.id;
    
    const newNegotiation = await Negotiation.create(req.body);
    
    res.status(201).json({
        status: 'success',
        data: { negotiation: newNegotiation }
    });
});

exports.getNegotiation = catchAsync(async (req, res, next) => {
    const negotiation = await Negotiation.findById(req.params.id)
        .populate('vehicle')
        .populate('client')
        .populate('messages.sender', 'name');
        
    if (!negotiation) {
        return next(new AppError('No negotiation found', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { negotiation }
    });
});

exports.addMessage = catchAsync(async (req, res, next) => {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) return next(new AppError('Negotiation not found', 404));
    
    negotiation.messages.push({
        sender: req.user.id,
        content: req.body.content,
        type: req.body.type || 'text'
    });
    
    await negotiation.save();
    
    res.status(200).json({ status: 'success', data: { negotiation } });
});

exports.makeOffer = catchAsync(async (req, res, next) => {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) return next(new AppError('Negotiation not found', 404));
    
    negotiation.offers.push({
        amount: req.body.amount,
        by: req.user.id,
        status: 'pending'
    });
    
    negotiation.currentOffer = req.body.amount;
    negotiation.status = 'offer_sent';
    
    await negotiation.save();
    
    res.status(200).json({ status: 'success', data: { negotiation } });
});
