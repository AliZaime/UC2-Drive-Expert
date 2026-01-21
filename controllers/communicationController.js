const catchAsync = require('../utils/catchAsync');
const email = require('../utils/email');

exports.sendEmail = catchAsync(async (req, res, next) => {
    // Wrapper to send custom emails
    const { to, subject, message } = req.body;
    
    await email({
        email: to,
        subject,
        message
    });
    
    res.status(200).json({ status: 'success', message: 'Email sent' });
});

exports.sendSMS = catchAsync(async (req, res, next) => {
    // Placeholder for Twilio or similar
    res.status(200).json({ status: 'success', message: 'SMS sent (mock)' });
});

exports.getChatHistory = catchAsync(async (req, res, next) => {
    // Retrieve chat logs
    res.status(200).json({ status: 'success', data: { messages: [] } });
});
