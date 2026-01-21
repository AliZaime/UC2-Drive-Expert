const express = require('express');
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/', sessionController.getAllSessions);
router.post('/audit', sessionController.getSessionAudit);

router.route('/:id')
    .get(sessionController.getSession)
    .delete(sessionController.deleteSession);

router.get('/device/:deviceId', (req, res) => { res.status(501).json({message: 'Not implemented'}); }); // Placeholder

module.exports = router;
