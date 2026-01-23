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

/**
 * @swagger
 * /my/profile:
 *   patch:
 *     summary: Update my profile
 *     tags: [Client]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Profile updated
 */
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
 *         description: List of recommended vehicles
 */
router.get('/vehicles/recommended', clientVehicleController.getRecommendedVehicles);

/**
 * @swagger
 * /my/vehicles/saved:
 *   get:
 *     summary: Get saved vehicles
 *     tags: [Client]
 *     responses:
 *       200:
 *         description: List of saved vehicles
 */
router.get('/vehicles/saved', clientVehicleController.getSavedVehicles);

/**
 * @swagger
 * /my/vehicles/{id}/save:
 *   post:
 *     summary: Save vehicle interest
 *     tags: [Client]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Vehicle saved
 */
router.post('/vehicles/:id/save', clientVehicleController.saveVehicleInterest);

// Negotiations
/**
 * @swagger
 * /my/negotiations:
 *   get:
 *     summary: Get my negotiations
 *     tags: [Client]
 *     responses:
 *       200:
 *         description: List of my negotiations
 */
router.get('/negotiations', clientNegotiationController.getMyNegotiations);

/**
 * @swagger
 * /my/negotiations/start:
 *   post:
 *     summary: Start a negotiation
 *     tags: [Client]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Negotiation started
 */
router.post('/negotiations/start', clientNegotiationController.startNegotiationResult);

// Contracts
/**
 * @swagger
 * /my/contracts:
 *   get:
 *     summary: Get my contracts
 *     tags: [Client]
 *     responses:
 *       200:
 *         description: List of my contracts
 */
router.get('/contracts', clientContractController.getMyContracts);

/**
 * @swagger
 * /my/contracts/{id}/sign:
 *   post:
 *     summary: Sign contract
 *     tags: [Client]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contract signed
 */
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
 *   patch:
 *     summary: Update appointment
 *     tags: [Client]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Appointment updated
 */
router.post('/appointments', appointmentController.bookAppointment);
router.get('/appointments', appointmentController.getMyAppointments);
router.patch('/appointments/:id', appointmentController.updateAppointment);

module.exports = router;
