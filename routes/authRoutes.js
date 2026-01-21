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
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/mfa/verify', authController.verifyMFA); // Public access for step 2 login
router.post('/qrcode/scan', authController.scanQRCode); // Public access for Kiosk without user session yet

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authMiddleware.protect);

router.post('/update-password', authController.updatePassword);

// MFA Routes
router.post('/mfa/enable', authController.enableMFA);
router.post('/mfa/disable', authController.disableMFA);
router.post('/mfa/verify', authController.verifyMFA); // Can be used logged in or for login step 2 (public usage needs handling in controller, I added logic there)

// QR / Kiosk
router.post('/qrcode/generate', authController.generateQRCode);
router.post('/qrcode/scan', authController.scanQRCode); // This should be public? Or protected by Kiosk Key? 
// For now, I'll move scanQRCode to PUBLIC if it's meant to be called by an unauthenticated Kiosk initially.
// But usually Kiosk has a service account.
// Let's assume Kiosk is authenticated as a device separately.
// For simplicity, I'll start with it protected (Kiosk must have a token) OR move it up.
// Looking at the requirements: "POST /auth/kiosk/login" "Connexion directe depuis kiosk".
// "POST /auth/qrcode/scan" "Scanner QR Code (kiosk)".
// I'll make /qrcode/scan public for now to allow easier testing, or put it before protect.

// router.get('/profile', authController.getProfile);
// router.patch('/profile', authController.updateProfile);

module.exports = router;
