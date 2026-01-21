const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);
// Restrict to Admin/Commercial?
// router.use(authMiddleware.restrictTo('admin', 'superadmin', 'manager'));

router.get('/dashboard', analyticsController.getDashboardAnalytics);
router.get('/funnel', analyticsController.getConversionFunnel);
router.get('/predictions', analyticsController.getPredictions);

router.post('/reports', reportController.generateReport);

module.exports = router;
