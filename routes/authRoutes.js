const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, confirmPassword]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login success
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout success
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh authentication token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New token issued
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /auth/mfa/verify:
 *   post:
 *     summary: Verify MFA code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: MFA verified
 */
router.post('/mfa/verify', authController.verifyMFA); // Public access for step 2 login

/**
 * @swagger
 * /auth/qrcode/scan:
 *   post:
 *     summary: Scan QR code for kiosk
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrData:
 *                 type: string
 *     responses:
 *       200:
 *         description: QR code scanned
 */
router.post('/qrcode/scan', authController.scanQRCode); // Public access for Kiosk without user session yet

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset link sent
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
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
 *               password:
 *                 type: string
 *               passwordConfirm:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authMiddleware.protect);

/**
 * @swagger
 * /auth/update-password:
 *   post:
 *     summary: Update password (authenticated)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               passwordCurrent:
 *                 type: string
 *               password:
 *                 type: string
 *               passwordConfirm:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post('/update-password', authController.updatePassword);

/**
 * @swagger
 * /auth/mfa/enable:
 *   post:
 *     summary: Enable MFA
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: MFA enabled
 */
// MFA Routes
router.post('/mfa/enable', authController.enableMFA);

/**
 * @swagger
 * /auth/mfa/disable:
 *   post:
 *     summary: Disable MFA
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: MFA disabled
 */
router.post('/mfa/disable', authController.disableMFA);

/**
 * @swagger
 * /auth/qrcode/generate:
 *   post:
 *     summary: Generate QR code for MFA
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: QR code generated
 */
// QR / Kiosk
router.post('/qrcode/generate', authController.generateQRCode);

// router.get('/profile', authController.getProfile);
// router.patch('/profile', authController.updateProfile);

module.exports = router;
