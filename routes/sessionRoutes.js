const express = require('express');
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: User session management
 */

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Get all sessions
 *     tags: [Sessions]
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/', sessionController.getAllSessions);

/**
 * @swagger
 * /sessions/audit:
 *   post:
 *     summary: Get session audit trail
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Audit trail
 */
router.post('/audit', sessionController.getSessionAudit);

/**
 * @swagger
 * /sessions/{id}:
 *   get:
 *     summary: Get session details
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session details
 *   delete:
 *     summary: Delete session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Session deleted
 */
router.route('/:id')
    .get(sessionController.getSession)
    .delete(sessionController.deleteSession);

/**
 * @swagger
 * /sessions/device/{deviceId}:
 *   get:
 *     summary: Get sessions by device
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       501:
 *         description: Not implemented
 */
router.get('/device/:deviceId', (req, res) => { res.status(501).json({message: 'Not implemented'}); }); // Placeholder

module.exports = router;
