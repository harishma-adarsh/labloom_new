const express = require('express');
const router = express.Router();
const {
    signup,
    requestOtp,
    verifyOtp,
    refreshAccessToken,
    logout
} = require('../controllers/authV2Controller');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Auth V2
 *   description: Enhanced multi-role authentication system
 */

/**
 * @swagger
 * /api/auth/v2/signup:
 *   post:
 *     summary: Register a new user with a specific role
 *     tags: [Auth V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, role]
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [patient, doctor, lab, hospital] }
 *     responses:
 *       201: { description: User registered }
 */
router.post('/signup', signup);

/**
 * @swagger
 * /api/auth/v2/request-otp:
 *   post:
 *     summary: Request OTP for mobile login
 *     tags: [Auth V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string }
 *     responses:
 *       200: { description: OTP sent }
 */
router.post('/request-otp', requestOtp);

/**
 * @swagger
 * /api/auth/v2/verify-otp:
 *   post:
 *     summary: Verify OTP and login
 *     tags: [Auth V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *             properties:
 *               phone: { type: string }
 *               otp: { type: string }
 *     responses:
 *       200: { description: Login successful }
 */
router.post('/verify-otp', verifyOtp);

/**
 * @swagger
 * /api/auth/v2/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Token refreshed }
 */
router.post('/refresh-token', refreshAccessToken);

/**
 * @swagger
 * /api/auth/v2/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth V2]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', protect, logout);

module.exports = router;
