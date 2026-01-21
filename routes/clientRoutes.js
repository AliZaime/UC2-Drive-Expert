const express = require('express');
const clientProfileController = require('../controllers/clientProfileController');
const clientVehicleController = require('../controllers/clientVehicleController');
const clientNegotiationController = require('../controllers/clientNegotiationController');
const clientContractController = require('../controllers/clientContractController');
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

/**
 * @swagger
 * tags:
 *   name: Client
 *   description: End-user client operations
 */

/**
 * @swagger
 * /my/profile:
 *   get:
 *     summary: Get my profile
 *     tags: [Client]
 *     responses:
 *       200:
 *         description: User profile and client details
 */
router.get('/profile', clientProfileController.getMyProfile);
router.get('/profile', clientProfileController.getMyProfile);
router.patch('/profile', clientProfileController.updateMyProfile);

// Privacy / COnsents
/**
 * @swagger
 * /my/consents:
 *   put:
 *     summary: Update GDPR consents
 *     tags: [Client]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               personalDataProcessing:
 *                 type: boolean
 *               marketingCommunication:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Consents updated
 */
router.put('/consents', clientProfileController.updateConsents);

/**
 * @swagger
 * /my/vehicles/recommended:
 *   get:
 *     summary: Get recommended vehicles
 *     tags: [Client]
 *     responses:
 *       200:
 *         description: List of vehicles
 */
router.get('/vehicles/recommended', clientVehicleController.getRecommendedVehicles);
router.get('/vehicles/saved', clientVehicleController.getSavedVehicles);
router.post('/vehicles/:id/save', clientVehicleController.saveVehicleInterest);

// Negotiations
router.get('/negotiations', clientNegotiationController.getMyNegotiations);
router.post('/negotiations/start', clientNegotiationController.startNegotiationResult);

// Contracts
router.get('/contracts', clientContractController.getMyContracts);
router.post('/contracts/:id/sign', clientContractController.signContract);

// Appointments
/**
 * @swagger
 * /my/appointments:
 *   get:
 *     summary: Get my appointments
 *     tags: [Client]
 *     responses:
 *       200:
 *         description: List of appointments
 *   post:
 *     summary: Book an appointment
 *     tags: [Client]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, agency]
 *             properties:
 *               date:
 *                 type: string
 *               agency:
 *                 type: string
 *               vehicle:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created
 */
router.post('/appointments', appointmentController.bookAppointment);
router.get('/appointments', appointmentController.getMyAppointments);
router.patch('/appointments/:id', appointmentController.updateAppointment);

module.exports = router;
