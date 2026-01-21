const User = require('../models/User');
const Client = require('../models/Client');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getMyProfile = catchAsync(async (req, res, next) => {
    // Current user profile
    const user = await User.findById(req.user.id);
    
    // Potentially get linked Client data
    const client = await Client.findOne({ user: req.user.id });
    
    res.status(200).json({
        status: 'success',
        data: {
            user,
            client
        }
    });
});

exports.updateMyProfile = catchAsync(async (req, res, next) => {
    // 1) Update User fields (email, name)
    // 2) Update Client fields (phone, preferences)
    
    // For simplicity, updating User model
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use /update-password.', 400));
    }

    const filteredBody = filterObj(req.body, 'name', 'email'); // Helper needed or inline
    const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });
    
    // Find or create Client profile
    let client = await Client.findOne({ user: req.user.id });
    if (client && (req.body.firstName || req.body.lastName || req.body.phone || req.body.preferences)) {
        // Update client fields...
         // Simplified:
        if (req.body.phone) client.phone = req.body.phone;
        await client.save();
    }

    res.status(200).json({
        status: 'success',
        data: { user, client }
    });
});

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};
