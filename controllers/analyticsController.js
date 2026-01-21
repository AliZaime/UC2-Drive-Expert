const catchAsync = require('../utils/catchAsync');
const Vehicle = require('../models/Vehicle');
const Negotiation = require('../models/Negotiation');

exports.getDashboardAnalytics = catchAsync(async (req, res, next) => {
    // Advanced aggregation
    // Example: Revenue by month
    const revenueStats = await Negotiation.aggregate([
        { $match: { status: 'deal_reached' } },
        { 
            $group: { 
                _id: { $month: "$updatedAt" }, 
                totalRevenue: { $sum: "$currentOffer" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    
    // Inventory breakdown
    const inventoryStats = await Vehicle.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            revenue: revenueStats,
            inventory: inventoryStats
        }
    });
});

exports.getConversionFunnel = catchAsync(async (req, res, next) => {
    // Mock funnel data
    const funnel = {
        leads: 1200,
        discussions: 450,
        offers: 180,
        deals: 45
    };
    
    res.status(200).json({ status: 'success', data: { funnel } });
});

exports.getPredictions = catchAsync(async (req, res, next) => {
    // Mock GenAI predictions
    const predictions = {
        avgSalesNextMonth: 52,
        churnRiskHigh: 12, // client IDs
        suggestedRestock: ['compact_suv', 'hybrid_sedan']
    };
    
    res.status(200).json({ status: 'success', data: { predictions } });
});
