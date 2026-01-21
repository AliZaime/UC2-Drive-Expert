const express = require('express');
const guestController = require('../controllers/guestController');
const kioskController = require('../controllers/kioskController');
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
router.get('/agencies/distances/:latlng/unit/:unit', agencyGeoController.getDistances);

// Kiosk (Management)
// Should be protected by admin or special key?
router.post('/kiosk/register', kioskController.registerDevice);
router.post('/kiosk/heartbeat', kioskController.heartbeat); // Typically auth'd
router.get('/kiosk/:id/config', kioskController.getConfig);

module.exports = router;
