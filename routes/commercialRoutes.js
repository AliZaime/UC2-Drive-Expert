const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const clientController = require('../controllers/clientController');
const negotiationController = require('../controllers/negotiationController');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

// Dashboard
router.get('/dashboard/overview', dashboardController.getOverview);
router.get('/dashboard/kpis', dashboardController.getKPIs);

/**
 * @swagger
 * tags:
 *   name: Commercial
 *   description: Commercial operations (Vehicles, Clients, Negotiations)
 */

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Get all vehicles
 *     tags: [Commercial]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of vehicles
 *   post:
 *     summary: Create a vehicle
 *     tags: [Commercial]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vin, make, model, year, price, agency]
 *             properties:
 *               vin:
 *                 type: string
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vehicle created
 */
router.route('/vehicles')
    .get(vehicleController.getAllVehicles)
    .post(vehicleController.createVehicle);

router.route('/vehicles/:id')
    .get(vehicleController.getVehicle)
    .put(vehicleController.updateVehicle)
    .delete(vehicleController.deleteVehicle);
    
router.post('/vehicles/:id/photos', vehicleController.uploadPhotosMiddleware, vehicleController.uploadVehiclePhotos);
router.get('/vehicles/:id/valuation', vehicleController.valueVehicle);

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Get all clients
 *     tags: [Commercial]
 *     responses:
 *       200:
 *         description: List of clients
 *   post:
 *     summary: Create a client
 *     tags: [Commercial]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email]
 *     responses:
 *       201:
 *         description: Client created
 */
router.route('/clients')
    .get(clientController.getAllClients)
    .post(clientController.createClient);

router.route('/clients/:id')
    .get(clientController.getClient)
    .put(clientController.updateClient);

router.post('/clients/:id/notes', clientController.addNote);

/**
 * @swagger
 * /negotiations:
 *   get:
 *     summary: Get all negotiations
 *     tags: [Commercial]
 *     responses:
 *       200:
 *         description: List of negotiations
 *   post:
 *     summary: Start a negotiation
 *     tags: [Commercial]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [client, vehicle, agency]
 *     responses:
 *       201:
 *         description: Negotiation created
 */
router.route('/negotiations')
    .get(negotiationController.getAllNegotiations)
    .post(negotiationController.createNegotiation);

router.route('/negotiations/:id')
    .get(negotiationController.getNegotiation);

router.post('/negotiations/:id/messages', negotiationController.addMessage);
router.post('/negotiations/:id/offer', negotiationController.makeOffer);

module.exports = router;
