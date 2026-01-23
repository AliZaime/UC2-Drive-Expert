const express = require('express');
const managerController = require('../controllers/managerController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Protect all routes and restrict to Manager role
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('manager'));

/**
 * @swagger
 * tags:
 *   name: Manager
 *   description: Manager operations for agency management
 */

/**
 * @swagger
 * /manager/dashboard:
 *   get:
 *     summary: Get manager dashboard with agency statistics
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     agencyId:
 *                       type: string
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalVehicles:
 *                           type: number
 *                         availableVehicles:
 *                           type: number
 *                         totalEmployees:
 *                           type: number
 *                         activeNegotiations:
 *                           type: number
 *                         totalClients:
 *                           type: number
 *                         monthlyContracts:
 *                           type: number
 *       400:
 *         description: Manager not assigned to any agency
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a manager
 */
router.get('/dashboard', managerController.getManagerDashboard);

/**
 * @swagger
 * /manager/agency:
 *   get:
 *     summary: Get agency information
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Agency information retrieved successfully
 *       404:
 *         description: Agency not found
 */
router.get('/agency', managerController.getAgencyInfo);

/**
 * @swagger
 * /manager/agency:
 *   patch:
 *     summary: Update agency information (limited fields)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+33123456789"
 *               email:
 *                 type: string
 *                 example: "contact@agency.com"
 *               config:
 *                 type: object
 *                 properties:
 *                   timezone:
 *                     type: string
 *                     example: "Europe/Paris"
 *                   currency:
 *                     type: string
 *                     example: "EUR"
 *     responses:
 *       200:
 *         description: Agency updated successfully
 *       400:
 *         description: Invalid input
 */
router.patch('/agency', managerController.updateAgencyInfo);

/**
 * @swagger
 * /manager/employees:
 *   get:
 *     summary: Get all employees of the manager's agency
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: number
 *                   example: 5
 *                 data:
 *                   type: object
 *                   properties:
 *                     employees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                             example: user
 *                           agency:
 *                             type: string
 *                           active:
 *                             type: boolean
 */
router.get('/employees', managerController.getAgencyEmployees);

/**
 * @swagger
 * /manager/employees:
 *   post:
 *     summary: Create a new employee (user) in the manager's agency
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jean Dupont"
 *               email:
 *                 type: string
 *                 example: "jean.dupont@agency.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               confirmPassword:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Invalid input or manager not assigned to agency
 */
router.post('/employees', managerController.createEmployee);

/**
 * @swagger
 * /manager/employees/{id}:
 *   patch:
 *     summary: Update an employee of the manager's agency
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               active:
 *                 type: boolean
 *               photo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       404:
 *         description: Employee not found in agency
 */
router.patch('/employees/:id', managerController.updateEmployee);

/**
 * @swagger
 * /manager/employees/{id}:
 *   delete:
 *     summary: Delete (deactivate) an employee
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       204:
 *         description: Employee deleted successfully
 *       404:
 *         description: Employee not found in agency
 */
router.delete('/employees/:id', managerController.deleteEmployee);

/**
 * @swagger
 * /manager/vehicles:
 *   get:
 *     summary: Get all vehicles of the manager's agency
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vehicles retrieved successfully
 */
router.get('/vehicles', managerController.getAgencyVehicles);

/**
 * @swagger
 * /manager/clients:
 *   get:
 *     summary: Get all clients of the manager's agency
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients retrieved successfully
 */
router.get('/clients', managerController.getAgencyClients);

/**
 * @swagger
 * /manager/negotiations:
 *   get:
 *     summary: Get all negotiations of the manager's agency
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of negotiations retrieved successfully
 */
router.get('/negotiations', managerController.getAgencyNegotiations);

/**
 * @swagger
 * /manager/analytics:
 *   get:
 *     summary: Get analytics for the manager's agency
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     salesData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: object
 *                             properties:
 *                               year:
 *                                 type: number
 *                               month:
 *                                 type: number
 *                           totalSales:
 *                             type: number
 *                           totalRevenue:
 *                             type: number
 *                     employeePerformance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           agentName:
 *                             type: string
 *                           totalSales:
 *                             type: number
 *                           totalRevenue:
 *                             type: number
 */
router.get('/analytics', managerController.getAgencyAnalytics);

module.exports = router;
