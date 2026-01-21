const express = require('express');
const contractController = require('../controllers/contractController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

/**
 * @swagger
 * tags:
 *   name: Contracts
 *   description: Contract management
 */

/**
 * @swagger
 * /contracts/generate:
 *   post:
 *     summary: Generate a contract from an accepted negotiation
 *     tags: [Contracts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [negotiationId]
 *     responses:
 *       201:
 *         description: Contract created
 */
router.post('/generate', contractController.generateContract);

/**
 * @swagger
 * /contracts/{id}/sign:
 *   post:
 *     summary: Client signs the contract
 *     tags: [Contracts]
 *     responses:
 *       200:
 *         description: Signed successfully
 */
router.post('/:id/sign', contractController.signContract);

router.get('/:id', contractController.getContract);

module.exports = router;
