const catchAsync = require('../utils/catchAsync');
const fs = require('fs');
const path = require('path');

exports.getSystemHealth = catchAsync(async (req, res, next) => {
    const health = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now()
    };
    try {
        res.status(200).json(health);
    } catch (error) {
        health.message = error;
        res.status(503).json(health);
    }
});

exports.getSystemLogs = catchAsync(async (req, res, next) => {
    // Read from logs directory
    const logPath = path.join(__dirname, '../logs/combined.log');
    
    if (fs.existsSync(logPath)) {
        const logs = fs.readFileSync(logPath, 'utf8');
        // Limit log output?
        const logLines = logs.split('\n').filter(Boolean).slice(-100); 
        
        res.status(200).json({
            status: 'success',
            results: logLines.length,
            data: { logs: logLines }
        });
    } else {
        res.status(200).json({
            status: 'success',
            message: 'No logs found or log file missing.'
        });
    }
});

exports.getSystemMetrics = (req, res) => {
    const metrics = {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version
    };
    res.status(200).json({ status: 'success', data: { metrics } });
};
