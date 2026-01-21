const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const qrcode = require('qrcode');
const { authenticator } = require('otplib');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

const signRefreshToken = id => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE
    });
};

const createSendToken = async (user, statusCode, req, res) => {
    const token = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Create session
    const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    await Session.create({
        user: user._id,
        refreshTokenHash: hashedRefreshToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        refreshToken,
        data: {
            user
        }
    });
};

exports.register = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        role: req.body.role || 'user' // Allow setting role for hackathon speed, secure later or restrict
    });

    createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3) Check if user has MFA enabled
    if (user.mfaEnabled) {
        // Issue a temporary token only valid for MFA verification
        const tempToken = jwt.sign({ id: user._id, role: 'pre_mfa' }, process.env.JWT_SECRET, {
            expiresIn: '10m'
        });
        
        return res.status(200).json({
            status: 'success',
            mfaRequired: true,
            tempToken
        });
    }

    // 4) If everything ok, send token to client
    createSendToken(user, 200, req, res);
});

exports.logout = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
        const hashedRefreshToken = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');
            
        await Session.findOneAndDelete({ refreshTokenHash: hashedRefreshToken });
    }

    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    
    res.status(200).json({ status: 'success' });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new AppError('No refresh token provided', 400));
    }

    // 1) Verify refresh token
    const decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 2) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer does exist.', 401));
    }

    // 3) Validate session
    const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    const session = await Session.findOne({
        refreshTokenHash: hashedRefreshToken,
        user: currentUser._id,
        isValid: true
    });

    if (!session) {
        return next(new AppError('Invalid or expired session', 401));
    }

    if (session.expiresAt < Date.now()) {
         await Session.findByIdAndDelete(session._id);
         return next(new AppError('Session expired', 401));
    }

    // 4) Issue new Access Token (keep same refresh token for now or rotate - implementing simple access renewal)
    const newAccessToken = signToken(currentUser._id);

    res.status(200).json({
        status: 'success',
        token: newAccessToken
    });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with email address.', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        await require('../utils/email')({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Try again later!'), 500);
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong', 401));
    }

    // 3) Update password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, req, res);
});

exports.enableMFA = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+mfaSecret');
    
    // Generate secret
    const secret = authenticator.generateSecret();
    
    // Save secret to user
    user.mfaSecret = secret;
    await user.save({ validateBeforeSave: false });
    
    // Generate QR Code
    const otpauth = authenticator.keyuri(user.email, 'Auto-UC2', secret);
    const imageUrl = await qrcode.toDataURL(otpauth);
    
    res.status(200).json({
        status: 'success',
        qrCode: imageUrl,
        secret
    });
});

exports.verifyMFA = catchAsync(async (req, res, next) => {
    const { token, code } = req.body;
    
    // Scenario 1: User is enabling MFA (logged in)
    if (req.user) {
        const user = await User.findById(req.user.id).select('+mfaSecret');
        const isValid = authenticator.check(code, user.mfaSecret);
        
        if (!isValid) {
            return next(new AppError('Invalid MFA code', 400));
        }
        
        user.mfaEnabled = true;
        await user.save({ validateBeforeSave: false });
        
        return res.status(200).json({
            status: 'success',
            message: 'MFA Enabled successfully'
        });
    }
    
    // Scenario 2: User is logging in (temp token provided)
    if (token) {
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        if (decoded.role !== 'pre_mfa') {
             return next(new AppError('Invalid token for MFA verification', 400));
        }
        
        const user = await User.findById(decoded.id).select('+mfaSecret');
        if (!user) return next(new AppError('User not found', 404));
        
        const isValid = authenticator.check(code, user.mfaSecret);
         if (!isValid) {
            return next(new AppError('Invalid MFA code', 400));
        }
        
        // Success! Issue full token
        createSendToken(user, 200, req, res);
    } else {
        return next(new AppError('Please provide token and code', 400));
    }
});

exports.disableMFA = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        message: 'MFA Disabled'
    });
});

// --- QR/Kiosk Logic ---

exports.generateQRCode = catchAsync(async (req, res, next) => {
    // Generate a secure random token for the kiosk to scan
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    
    // Store in Session with short expiry
    await Session.create({
        user: req.user._id,
        refreshTokenHash: hash,
        deviceType: 'kiosk',
        isValid: false, 
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 mins
    });
    
    // Return the token as QR
    const qrImage = await qrcode.toDataURL(sessionToken);
    
    res.status(200).json({
        status: 'success',
        qrCode: qrImage,
        token: sessionToken
    });
});

exports.scanQRCode = catchAsync(async (req, res, next) => {
    const { token } = req.body;
    
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    
    const session = await Session.findOne({ refreshTokenHash: hash });
    
    if (!session || session.expiresAt < Date.now()) {
        return next(new AppError('Invalid or expired QR code', 400));
    }
    
    const user = await User.findById(session.user);
    
    await Session.findByIdAndDelete(session._id);
    
    createSendToken(user, 200, req, res);
});

