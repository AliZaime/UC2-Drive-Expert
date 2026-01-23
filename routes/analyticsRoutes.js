const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);
// Restrict to Admin/Commercial?
// router.use(authMiddleware.restrictTo('admin', 'superadmin', 'manager'));

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and reporting
 */

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 */
router.get('/dashboard', analyticsController.getDashboardAnalytics);

/**
 * @swagger
 * /analytics/funnel:
 *   get:
 *     summary: Get conversion funnel
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Conversion funnel data
 */
router.get('/funnel', analyticsController.getConversionFunnel);

/**
 * @swagger
 * /analytics/predictions:
 *   get:
 *     summary: Get AI predictions
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Predictions data
 */
router.get('/predictions', analyticsController.getPredictions);

/**
 * @swagger
 * /analytics/reports:
 *   post:
 *     summary: Generate report
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Report generated
 */
router.post('/reports', reportController.generateReport);

module.exports = router;
