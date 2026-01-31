const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const clientController = require('../controllers/clientController');
const negotiationController = require('../controllers/negotiationController');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

// Dashboard
/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Get dashboard overview
 *     tags: [Commercial]
 *     responses:
 *       200:
 *         description: Dashboard overview data
 */
router.get('/dashboard/overview', dashboardController.getOverview);

/**
 * @swagger
 * /dashboard/kpis:
 *   get:
 *     summary: Get KPIs metrics
 *     tags: [Commercial]
 *     responses:
 *       200:
 *         description: KPIs data
 */
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
    .post(authMiddleware.restrictTo('manager', 'admin', 'user'), vehicleController.createVehicle);

/**
 * @swagger
 * /vehicles/search:
 *   get:
 *     summary: Search vehicles by VIN, make or model
 *     tags: [Commercial]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (VIN, make/brand, or model)
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Search query is required
 */
router.get('/vehicles/search', vehicleController.searchVehicles);

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Commercial]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle details
 *       404:
 *         description: Vehicle not found
 *   put:
 *     summary: Update vehicle
 *     tags: [Commercial]
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
 *         description: Vehicle updated
 *       404:
 *         description: Vehicle not found
 *   delete:
 *     summary: Delete vehicle
 *     tags: [Commercial]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Vehicle deleted
 *       404:
 *         description: Vehicle not found
 */
router.route('/vehicles/:id')
    .get(vehicleController.getVehicle)
    .put(authMiddleware.restrictTo('superadmin', 'manager', 'admin', 'user'), vehicleController.updateVehicle)
    .delete(authMiddleware.restrictTo('superadmin', 'manager', 'admin', 'user'), vehicleController.deleteVehicle);

/**
 * @swagger
 * /vehicles/{id}/photos:
 *   post:
 *     summary: Upload vehicle photos
 *     tags: [Commercial]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 */
router.post('/vehicles/:id/photos', authMiddleware.restrictTo('manager', 'admin', 'user'), vehicleController.uploadPhotosMiddleware, vehicleController.uploadVehiclePhotos);

/**
 * @swagger
 * /vehicles/{id}/valuation:
 *   get:
 *     summary: Get vehicle valuation
 *     tags: [Commercial]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle valuation data
 */
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

/**
 * @swagger
 * /clients/search:
 *   get:
 *     summary: Search clients by name or contact info
 *     tags: [Commercial]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (first name, last name, email, phone)
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Search query is required
 */
router.get('/clients/search', clientController.searchClients);

/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Commercial]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client details
 *       404:
 *         description: Client not found
 *   put:
 *     summary: Update client
 *     tags: [Commercial]
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
 *         description: Client updated
 *       404:
 *         description: Client not found
 */
router.route('/clients/:id')
    .get(clientController.getClient)
    .put(clientController.updateClient);

/**
 * @swagger
 * /clients/{id}/notes:
 *   post:
 *     summary: Add note to client
 *     tags: [Commercial]
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
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note added
 */
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

/**
 * @swagger
 * /negotiations/{id}:
 *   get:
 *     summary: Get negotiation by ID
 *     tags: [Commercial]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Negotiation details
 *       404:
 *         description: Negotiation not found
 */
router.route('/negotiations/:id')
    .get(negotiationController.getNegotiation);

/**
 * @swagger
 * /negotiations/{id}/messages:
 *   post:
 *     summary: Add message to negotiation
 *     tags: [Commercial]
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
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message added
 */
router.post('/negotiations/:id/messages', negotiationController.addMessage);

/**
 * @swagger
 * /negotiations/{id}/offer:
 *   post:
 *     summary: Make offer in negotiation
 *     tags: [Commercial]
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
 *             properties:
 *               price:
 *                 type: number
 *               terms:
 *                 type: string
 *     responses:
 *       201:
 *         description: Offer made
 */
router.post('/negotiations/:id/offer', negotiationController.makeOffer);


const managerController = require('../controllers/managerController');

/**
 * @swagger
 * /my/team:
 *   get:
 *     summary: Get my agency's agents
 *     tags: [Commercial]
 *     responses:
 *       200:
 *         description: List of agents
 *   post:
 *     summary: Create new agent in my agency
 *     tags: [Commercial]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *     responses:
 *       201:
 *         description: Agent created
 */
router.route('/my/team')
    .get(authMiddleware.restrictTo('manager'), managerController.getMyAgents)
    .post(authMiddleware.restrictTo('manager'), managerController.createAgent);

module.exports = router;
