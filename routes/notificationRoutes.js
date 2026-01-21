const express = require('express');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications management
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get my notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', notificationController.getMyNotifications);

/**
 * @swagger
 * /notifications/mark-all-read:
 *   put:
 *     summary: Mark all as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/mark-all-read', notificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark specific notification as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
