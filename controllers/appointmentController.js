const Appointment = require('../models/Appointment');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const notificationController = require('./notificationController');

exports.bookAppointment = catchAsync(async (req, res, next) => {
    // Basic availability check could go here
    
    const newAppointment = await Appointment.create({
        client: req.user.id,
        agency: req.body.agency,
        vehicle: req.body.vehicle,
        date: req.body.date,
        type: req.body.type,
        notes: req.body.notes
    });

    // Notify Admins? For now just confirm to user
    await notificationController.createNotification({
        recipient: req.user.id,
        title: 'Rendez-vous Demandé',
        message: `Votre demande pour le ${new Date(req.body.date).toLocaleString()} est prise en compte.`,
        type: 'info'
    });

    res.status(201).json({
        status: 'success',
        data: { appointment: newAppointment }
    });
});

exports.getMyAppointments = catchAsync(async (req, res, next) => {
    const appointments = await Appointment.find({ client: req.user.id })
                                          .populate('agency')
                                          .populate('vehicle');

    res.status(200).json({
        status: 'success',
        results: appointments.length,
        data: { appointments }
    });
});

exports.updateAppointment = catchAsync(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return next(new AppError('No appointment found', 404));
    
    // Check ownership
    if (appointment.client.toString() !== req.user.id) {
         return next(new AppError('Not your appointment', 403));
    }

    if (appointment.status !== 'pending') {
        return next(new AppError('Only pending appointments can be modified', 400));
    }

    if (req.body.status === 'cancelled') {
        appointment.status = 'cancelled';
    } else {
        if (req.body.date) {
            appointment.date = req.body.date;
        }
        if (req.body.type) {
            appointment.type = req.body.type;
        }
        if (typeof req.body.notes !== 'undefined') {
            appointment.notes = req.body.notes;
        }
    }
    
    await appointment.save();

    res.status(200).json({
        status: 'success',
        data: { appointment }
    });
});
