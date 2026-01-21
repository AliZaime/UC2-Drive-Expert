const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const socket = require('../utils/socket'); // Import socket util

// Get my notifications
exports.getMyNotifications = catchAsync(async (req, res, next) => {
    const notifications = await Notification.find({ recipient: req.user.id })
                                            .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: notifications.length,
        data: { notifications }
    });
});

// Mark as read
exports.markAsRead = catchAsync(async (req, res, next) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user.id },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        return next(new AppError('Notification not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { notification }
    });
});

// Mark ALL as read
exports.markAllAsRead = catchAsync(async (req, res, next) => {
    await Notification.updateMany(
        { recipient: req.user.id, isRead: false },
        { isRead: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read'
    });
});

// Internal helper to create notification
exports.createNotification = async ({ recipient, title, message, type, data }) => {
    try {
        const newNotif = await Notification.create({ recipient, title, message, type, data });

        // Emit Real-time event
        try {
            const io = socket.getIO();
            // Emit to the user's specific room (room name = user ID)
            io.to(recipient.toString()).emit('notification', {
                title,
                message,
                type,
                data
            });
            console.log(`📡 Real-time notification sent to ${recipient}`);
        } catch (socketErr) {
            console.error('Socket emit failed:', socketErr.message);
        }

    } catch (err) {
        console.error('Failed to create notification', err);
    }
};
