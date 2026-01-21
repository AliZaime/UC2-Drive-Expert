const Contract = require('../models/Contract');
const Negotiation = require('../models/Negotiation');
const Vehicle = require('../models/Vehicle'); // For checking status
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const notificationController = require('./notificationController');

exports.generateContract = catchAsync(async (req, res, next) => {
    // 1) Get Negotiation
    const negotiation = await Negotiation.findById(req.body.negotiationId);
    if (!negotiation) return next(new AppError('Negotiation not found', 404));

    if (negotiation.status !== 'accepted') {
        return next(new AppError('Negotiation must be ACCEPTED before contract generation', 400));
    }

    // 2) Check if contract already exists
    const existing = await Contract.findOne({ negotiation: negotiation._id });
    if (existing) {
        return res.status(200).json({ status: 'success', data: { contract: existing }, message: 'Contract already exists' });
    }

    // 3) Create Contract Draft
    const contract = await Contract.create({
        negotiation: negotiation._id,
        client: negotiation.client,
        vehicle: negotiation.vehicle,
        type: req.body.type || 'Purchase', // Default or passed
        terms: {
            price: negotiation.offers[negotiation.offers.length - 1].amount, // Final price
            startDate: Date.now()
        },
        status: 'draft'
    });

    // 4) Notify Client
    await notificationController.createNotification({
        recipient: negotiation.client,
        title: 'Contract Ready',
        message: 'Your contract is ready for review and signature.',
        type: 'success',
        data: { contractId: contract._id }
    });

    res.status(201).json({
        status: 'success',
        data: { contract }
    });
});

exports.signContract = catchAsync(async (req, res, next) => {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return next(new AppError('Contract not found', 404));

    // Simple Signing Logic (Mocking digital signature)
    // Check if user is the client linked to contract
    if (contract.client.toString() !== req.user.id) {
        return next(new AppError('You are not the client for this contract', 403));
    }

    contract.signatures.client.signed = true;
    contract.signatures.client.signedAt = Date.now();
    contract.signatures.client.ip = req.ip;
    
    contract.status = 'signed'; // Or 'partially_signed' if agency needs to sign too
    await contract.save();

    // Notify Commercial/Agency
    // (Ideally we find the commercial agent responsible, for now we skip or log)
    
    res.status(200).json({
        status: 'success',
        message: 'Contract signed successfully!',
        data: { contract }
    });
});

exports.getContract = catchAsync(async (req, res, next) => {
    const contract = await Contract.findById(req.params.id)
        .populate('vehicle')
        .populate('client');

    if (!contract) return next(new AppError('Contract not found', 404));

    res.status(200).json({
        status: 'success',
        data: { contract }
    });
});
