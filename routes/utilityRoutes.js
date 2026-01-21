const express = require('express');
const documentController = require('../controllers/documentController');
const communicationController = require('../controllers/communicationController');
const auditController = require('../controllers/auditController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

// Documents
router.post('/documents/generate', documentController.generateDocument);
router.post('/documents/upload', documentController.uploadMiddleware, documentController.uploadDocument);

// Communication
router.post('/communications/email', communicationController.sendEmail);
router.post('/communications/sms', communicationController.sendSMS);
router.get('/communications/history', communicationController.getChatHistory);

// Audit
router.get('/audit/logs', auditController.getAuditLogs);

module.exports = router;
