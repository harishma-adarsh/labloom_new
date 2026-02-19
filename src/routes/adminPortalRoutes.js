const express = require('express');
const router = express.Router();
const {
    adminRequestOtp,
    adminVerifyOtp,
    seedAdmin,
    getPendingHospitals,
    approveHospital,
    getPendingLabs,
    approveLab,
    getPendingDoctors,
    approveDoctor,
    getAllUsers,
    updateUserStatus,
    getSystemAnalytics
} = require('../controllers/adminPortalController');
const { protect, admin } = require('../middleware/authMiddleware');

// ===== PUBLIC ROUTES (No auth needed) =====

/**
 * @swagger
 * /api/admin/request-otp:
 *   post:
 *     summary: Request OTP for admin login (predefined phone 9999999999)
 *     tags: [Admin Portal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string, example: "9999999999" }
 *     responses:
 *       200: { description: OTP sent }
 *       401: { description: Not authorized as admin }
 */
router.post('/request-otp', adminRequestOtp);

/**
 * @swagger
 * /api/admin/verify-otp:
 *   post:
 *     summary: Verify OTP and get admin access token
 *     tags: [Admin Portal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *             properties:
 *               phone: { type: string, example: "9999999999" }
 *               otp: { type: string, example: "1234" }
 *     responses:
 *       200: { description: Admin login successful, returns access token }
 *       400: { description: Invalid or expired OTP }
 */
router.post('/verify-otp', adminVerifyOtp);

// ===== PROTECTED ROUTES (Admin only) =====
router.use(protect);
router.use(admin);

/**
 * @swagger
 * tags:
 *   name: Admin Portal
 *   description: Super admin governance and platform-wide management
 */

/**
 * @swagger
 * /api/admin/pending-hospitals:
 *   get:
 *     summary: List hospitals awaiting verification
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of hospitals }
 */
router.get('/pending-hospitals', getPendingHospitals);

/**
 * @swagger
 * /api/admin/approve-hospital/{id}:
 *   post:
 *     summary: Approve/Enable a hospital entity
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Hospital approved }
 */
router.post('/approve-hospital/:id', approveHospital);

/**
 * @swagger
 * /api/admin/pending-labs:
 *   get:
 *     summary: List diagnostic centers awaiting verification
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of labs }
 */
router.get('/pending-labs', getPendingLabs);

/**
 * @swagger
 * /api/admin/approve-lab/{id}:
 *   post:
 *     summary: Approve/Enable a lab entity
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lab approved }
 */
router.post('/approve-lab/:id', approveLab);

/**
 * @swagger
 * /api/admin/pending-doctors:
 *   get:
 *     summary: List doctors awaiting verification
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of doctors }
 */
router.get('/pending-doctors', getPendingDoctors);

/**
 * @swagger
 * /api/admin/approve-doctor/{id}:
 *   post:
 *     summary: Approve/Enable a doctor entity
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Doctor approved }
 */
router.post('/approve-doctor/:id', approveDoctor);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Search and manage all platform users
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of users }
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Suspend or deactivate accounts
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: { isActive: { type: boolean } }
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/users/:id/status', updateUserStatus);

/**
 * @swagger
 * /api/admin/reports/system:
 *   get:
 *     summary: Platform-wide usage and growth analytics
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Analytics data }
 */
router.get('/reports/system', getSystemAnalytics);

module.exports = router;
