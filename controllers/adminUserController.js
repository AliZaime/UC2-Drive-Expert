const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const jwt = require('jsonwebtoken');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();
    
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: { users }
    });
});

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { user }
    });
});

exports.createUser = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);
    
    // Remove password from output
    newUser.password = undefined;
    
    res.status(201).json({
        status: 'success',
        data: { user: newUser }
    });
});

exports.updateUser = catchAsync(async (req, res, next) => {
    // Prevent updating password via this route
    if (req.body.password || req.body.confirmPassword) {
        return next(new AppError('This route is not for password updates. Please use /update-password.', 400));
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    
    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { user }
    });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }
    
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.impersonateUser = catchAsync(async (req, res, next) => {
    // 1) Find the user to impersonate
    const user = await User.findById(req.params.id);
    
    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    // 2) Generate a token directly
    const token = signToken(user._id);

    // 3) Send it back (Admin can now use this token to "be" this user)
    res.status(200).json({
        status: 'success',
        message: `Now impersonating ${user.name || user.email}`,
        token,
        data: { user }
    });
});
