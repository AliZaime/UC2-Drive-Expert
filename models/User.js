const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        // match: [isValidEmail, 'Please provide a valid email']
    },
    photo: String,
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'manager', 'user', 'client', 'guest'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    confirmPassword: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE and SAVE!!!
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    // Security Fields
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    
    // MFA
    mfaEnabled: {
        type: Boolean,
        default: false
    },
    mfaSecret: {
        type: String,
        select: false
    },

    // Agency Assignment (for managers and users)
    agency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agency'
    },

    // Privacy & Consents (GDPR)
    consents: {
        personalDataProcessing: { type: Boolean, default: false }, // Use of personal info
        marketingCommunication: { type: Boolean, default: false }, // Contact by agents/marketing
        thirdPartySharing: { type: Boolean, default: false },
        updatedAt: Date
    },
    
    active: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
    timestamps: true
});

// Middleware to hash password
userSchema.pre('save', async function() {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return;

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field
    this.confirmPassword = undefined;
});

// Middleware to update passwordChangedAt
userSchema.pre('save', function() {
    if (!this.isModified('password') || this.isNew) return;

    this.passwordChangedAt = Date.now() - 1000;
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password changed after token issuance
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    // False means NOT changed
    return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Expires in 10 mins
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
