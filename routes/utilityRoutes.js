const express = require('express');
const documentController = require('../controllers/documentController');
const communicationController = require('../controllers/communicationController');
const auditController = require('../controllers/auditController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

/**
 * @swagger
 * tags:
 *   name: Utilities
 *   description: Document, Communication, and Audit utilities
 */

// Documents
/**
 * @swagger
 * /utils/documents/generate:
 *   post:
 *     summary: Generate document
 *     tags: [Utilities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Document generated
 */
router.post('/documents/generate', documentController.generateDocument);

/**
 * @swagger
 * /utils/documents/upload:
 *   post:
 *     summary: Upload document
 *     tags: [Utilities]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded
 */
router.post('/documents/upload', documentController.uploadMiddleware, documentController.uploadDocument);

// Communication
/**
 * @swagger
 * /utils/communications/email:
 *   post:
 *     summary: Send email
 *     tags: [Utilities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent
 */
router.post('/communications/email', communicationController.sendEmail);

/**
 * @swagger
 * /utils/communications/sms:
 *   post:
 *     summary: Send SMS
 *     tags: [Utilities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: SMS sent
 */
router.post('/communications/sms', communicationController.sendSMS);

/**
 * @swagger
 * /utils/communications/history:
 *   get:
 *     summary: Get communication history
 *     tags: [Utilities]
 *     responses:
 *       200:
 *         description: Communication history
 */
router.get('/communications/history', communicationController.getChatHistory);

// Audit
/**
 * @swagger
 * /utils/audit/logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Utilities]
 *     responses:
 *       200:
 *         description: Audit logs
 */
router.get('/audit/logs', auditController.getAuditLogs);

module.exports = router;
