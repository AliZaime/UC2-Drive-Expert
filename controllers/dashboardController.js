const Vehicle = require('../models/Vehicle');
const Negotiation = require('../models/Negotiation');
const Client = require('../models/Client');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
    // Aggregation for dashboard
    // Stats: active negotiations, inventory count, recent clients
    
    const [vehicleCount, negotiationCount, clientCount] = await Promise.all([
        Vehicle.countDocuments({ status: 'available' }), // Add agency filter if needed
        Negotiation.countDocuments({ status: { $in: ['open', 'discussion', 'offer_sent'] } }),
        Client.countDocuments({ status: { $ne: 'Inactive' } })
    ]);
    
    // Latest activities (simplified for now)
    const recentNegotiations = await Negotiation.find()
        .sort('-updatedAt')
        .limit(5)
        .populate('client', 'firstName lastName')
        .populate('vehicle', 'make model');

    res.status(200).json({
        status: 'success',
        data: {
            stats: {
                inventory: vehicleCount,
                activeNegotiations: negotiationCount,
                activeClients: clientCount
            },
            recentActivity: recentNegotiations
        }
    });
});

exports.getKPIs = catchAsync(async (req, res, next) => {
    // Placeholders for real calculation
    res.status(200).json({
        status: 'success',
        data: {
            conversionRate: 12.5,
            avgDealTimeDays: 4,
            monthlySalesTarget: 80,
            revenueYTD: 154000
        }
    });
});
