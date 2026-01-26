const express = require('express');
const guestController = require('../controllers/guestController');
const kioskController = require('../controllers/kioskController');
const adminAgencyController = require('../controllers/adminAgencyController');
// const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Publicly accessible operations
 */

/**
 * @swagger
 * /public/browse:
 *   get:
 *     summary: Browse available vehicles
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of vehicles
 */
router.get('/browse', guestController.browseVehicles);

/**
 * @swagger
 * /public/vehicle/{id}:
 *   get:
 *     summary: Get vehicle details
 *     tags: [Public]
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
 */
router.get('/vehicle/:id', guestController.getVehicleDetails);

const agencyGeoController = require('../controllers/agencyGeoController');

// Geolocation
/**
 * @swagger
 * /public/agencies-within/{distance}/center/{latlng}/unit/{unit}:
 *   get:
 *     summary: Find agencies within radius
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: distance
 *         required: true
 *         schema:
 *           type: number
 *       - in: path
 *         name: latlng
 *         required: true
 *         schema:
 *           type: string
 *         description: "lat,lng"
 *       - in: path
 *         name: unit
 *         required: true
 *         schema:
 *           type: string
 *           enum: [km, mi]
 *     responses:
 *       200:
 *         description: List of agencies
 */
router.get('/agencies-within/:distance/center/:latlng/unit/:unit', agencyGeoController.getAgenciesWithin);

/**
 * @swagger
 * /public/agencies/distances/{latlng}/unit/{unit}:
 *   get:
 *     summary: Get distances to agencies
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: latlng
 *         required: true
 *         schema:
 *           type: string
 *         description: "lat,lng"
 *       - in: path
 *         name: unit
 *         required: true
 *         schema:
 *           type: string
 *           enum: [km, mi]
 *     responses:
 *       200:
 *         description: List of agencies with distances
 */
router.get('/agencies/distances/:latlng/unit/:unit', agencyGeoController.getDistances);

// Kiosk (Management)
/**
 * @swagger
 * /public/kiosk/register:
 *   post:
 *     summary: Register kiosk device
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Kiosk registered
 */
router.post('/kiosk/register', kioskController.registerDevice);

/**
 * @swagger
 * /public/kiosk/heartbeat:
 *   post:
 *     summary: Kiosk heartbeat
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Heartbeat received
 */
router.post('/kiosk/heartbeat', kioskController.heartbeat); // Typically auth'd

/**
 * @swagger
 * /public/kiosk/{id}/config:
 *   get:
 *     summary: Get kiosk configuration
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kiosk configuration
 */
router.get('/kiosk/:id/config', kioskController.getConfig);

// Get available users from agency (for client contact) - Public endpoint
router.get('/agencies/:id/available-users', adminAgencyController.getAgencyAvailableUsers);

module.exports = router;
