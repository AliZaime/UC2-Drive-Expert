const Contract = require('../models/Contract');
const Client = require('../models/Client');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getMyContracts = catchAsync(async (req, res, next) => {
    const client = await Client.findOne({ user: req.user.id });
    if (!client) {
         return res.status(200).json({ status: 'success', results: 0, data: { contracts: [] } });
    }
    
    const contracts = await Contract.find({ client: client._id }).populate('vehicle');
    
    res.status(200).json({
        status: 'success',
        results: contracts.length,
        data: { contracts }
    });
});

exports.signContract = catchAsync(async (req, res, next) => {
    // Digital signature logic
    const contract = await Contract.findById(req.params.id);
    if (!contract) return next(new AppError('Contract not found', 404));
    
    // Verify ownership
    
    contract.signatures.client.signed = true;
    contract.signatures.client.signedAt = Date.now();
    contract.signatures.client.ip = req.ip;
    
    contract.status = 'signed'; // or 'completed' if agency already signed
    
    await contract.save();
    
    res.status(200).json({ status: 'success', data: { contract } });
});
