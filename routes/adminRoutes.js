const express = require('express');
const adminAgencyController = require('../controllers/adminAgencyController');
const adminUserController = require('../controllers/adminUserController');
const adminSystemController = require('../controllers/adminSystemController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Protect all routes and restrict to Admin/SuperAdmin
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin', 'superadmin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative operations
 */

/**
 * @swagger
 * /admin/system/health:
 *   get:
 *     summary: Check system health
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: System is healthy
 */
router.get('/system/health', adminSystemController.getSystemHealth);
router.get('/system/logs', adminSystemController.getSystemLogs);
router.get('/system/metrics', adminSystemController.getSystemMetrics);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of users
 *   post:
 *     summary: Create a user
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *     responses:
 *       201:
 *         description: User created
 */
router.route('/users')
    .get(adminUserController.getAllUsers)
    .post(adminUserController.createUser);

router.route('/users/:id')
    .get(adminUserController.getUser)
    .put(adminUserController.updateUser)
    .delete(adminUserController.deleteUser);

/**
 * @swagger
 * /admin/users/{id}/impersonate:
 *   post:
 *     summary: Impersonate a user (Get Token)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token returned
 */
router.post('/users/:id/impersonate', adminUserController.impersonateUser);

/**
 * @swagger
 * /admin/agencies:
 *   get:
 *     summary: Get all agencies
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of agencies
 *   post:
 *     summary: Create an agency
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *     responses:
 *       201:
 *         description: Agency created
 */
router.route('/agencies')
    .get(adminAgencyController.getAllAgencies)
    .post(adminAgencyController.createAgency);

router.route('/agencies/:id')
    .get(adminAgencyController.getAgency)
    .put(adminAgencyController.updateAgency)
    .delete(adminAgencyController.deleteAgency);

// Nested Kiosks
router.route('/agencies/:id/kiosks')
    .get(adminAgencyController.getAgencyKiosks)
    .post(adminAgencyController.createAgencyKiosk);

module.exports = router;
