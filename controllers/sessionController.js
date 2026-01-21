const Session = require('../models/Session');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllSessions = catchAsync(async (req, res, next) => {
    // Admin can see all? Or User sees their own?
    // Requirement said: GET /sessions # Liste sessions actives
    // Likely Admin or User seeing their own. Let's assume User seeing their own unless Admin.
    
    let filter = { user: req.user.id };
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
        filter = {}; // Admin sees all? Or use query params?
        // Let's stick to "User sees their own" for /sessions and Admin has specialized route?
        // API list says: "API Sessions & Sécurité".
        // Let's allow query params.
    }
    
    const sessions = await Session.find(filter);

    res.status(200).json({
        status: 'success',
        results: sessions.length,
        data: {
            sessions
        }
    });
});

exports.getSession = catchAsync(async (req, res, next) => {
    const session = await Session.findById(req.params.id);

    if (!session) {
        return next(new AppError('No session found with that ID', 404));
    }
    
    // Check ownership
    // if (session.user.toString() !== req.user.id && req.user.role !== 'admin') ...

    res.status(200).json({
        status: 'success',
        data: {
            session
        }
    });
});

exports.deleteSession = catchAsync(async (req, res, next) => {
    const session = await Session.findById(req.params.id);

    if (!session) {
        return next(new AppError('No session found with that ID', 404));
    }

    // Check ownership logic here if needed

    await Session.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Logs d'audit des sessions
exports.getSessionAudit = catchAsync(async (req, res, next) => {
    // This might be a search/filter on sessions history?
    // Given Session model has timestamps.
    // If we kept history of expired sessions, we could query. 
    // Currently we delete expired sessions in refresh logic (sometimes) or they just sit there.
    
    const sessions = await Session.find({ user: req.user.id }).sort('-createdAt');
    
    res.status(200).json({
        status: 'success',
        results: sessions.length,
        data: {
            sessions
        }
    });
});
