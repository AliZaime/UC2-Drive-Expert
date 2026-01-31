const User = require('../models/User');
const Client = require('../models/Client');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

exports.uploadMiddleware = upload.single('photo');

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

exports.updateConsents = catchAsync(async (req, res, next) => {
    // Update user consent preferences (GDPR)
    const { personalDataProcessing, marketingCommunication } = req.body;
    
    const user = await User.findByIdAndUpdate(
        req.user.id,
        {
            consents: {
                personalDataProcessing: personalDataProcessing !== undefined ? personalDataProcessing : true,
                marketingCommunication: marketingCommunication !== undefined ? marketingCommunication : false
            }
        },
        {
            new: true,
            runValidators: true
        }
    );
    
    res.status(200).json({
        status: 'success',
        data: { user }
    });
});

exports.updateMyProfilePhoto = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload a photo', 400));
    }

    try {
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'user_profiles',
                    transformation: [
                        { width: 256, height: 256, crop: 'fill', gravity: 'face' },
                        { quality: 'auto' }
                    ],
                    timeout: 60000
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
            uploadStream.end(req.file.buffer);
        });

        // Update user photo
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { photo: result.secure_url },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            photo: result.secure_url
        });
    } catch (error) {
        console.error('Photo upload error:', error);
        return next(new AppError('Failed to upload photo', 500));
    }
});

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.getMySavedVehicles = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate({
        path: 'savedVehicles',
        populate: { path: 'agency' } // Populate agency in vehicle
    });
    
    res.status(200).json({
        status: 'success',
        results: user.savedVehicles ? user.savedVehicles.length : 0,
        data: { vehicles: user.savedVehicles || [] }
    });
});

exports.toggleSavedVehicle = catchAsync(async (req, res, next) => {
    const { vehicleId } = req.body;
    
    if (!vehicleId) {
        return next(new AppError('Vehicle ID is required', 400));
    }
    
    const user = await User.findById(req.user.id);
    
    // Check if already saved
    // Ensure savedVehicles array is initialized
    if (!user.savedVehicles) user.savedVehicles = [];
    
    const index = user.savedVehicles.indexOf(vehicleId);
    let action = '';
    
    if (index > -1) {
        // Remove
        user.savedVehicles.splice(index, 1);
        action = 'removed';
    } else {
        // Add
        user.savedVehicles.push(vehicleId);
        action = 'added';
    }
    
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
        status: 'success',
        action,
        data: { savedVehicles: user.savedVehicles }
    });
});

