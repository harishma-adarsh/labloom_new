const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    sendOtp,
    updateProfile,
    getProfile
} = require('../controllers/authController');
const {
    signup,
    requestOtp,
    verifyOtp: verifyOtpV2,
    refreshAccessToken,
    logout
} = require('../controllers/authV2Controller');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and User Management
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [patient, doctor, lab, hospital] }
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/signup', signup);
router.post('/register', signup); // Alias for signup

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a user (Password-based)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /api/auth/request-otp:
 *   post:
 *     summary: Request OTP for mobile login
 *     tags: [Auth]
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
 *       200:
 *         description: OTP sent successfully
 */
router.post('/request-otp', requestOtp);
router.post('/send-otp', requestOtp); // Alias

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and login
 *     tags: [Auth]
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
 *       200:
 *         description: Login successful
 */
router.post('/verify-otp', verifyOtpV2);
router.post('/login-otp', verifyOtpV2); // Alias

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 */
router.post('/refresh-token', refreshAccessToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/logout', protect, logout);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);
router.get('/me', protect, getMe);

// Friendly GET handler for /signup to avoid "Cannot GET" errors in browser
router.get('/signup', (req, res) => {
    res.status(200).json({
        message: 'Signup endpoint is active. Please use POST request to register.',
        documentation: '/api-docs',
        requiredFields: ['name', 'phone', 'role']
    });
});

module.exports = router;
