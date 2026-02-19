const express = require('express');
const router = express.Router();
const {
    adminRequestOtp,
    adminVerifyOtp,
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

/**
 * @swagger
 * tags:
 *   name: Admin Portal
 *   description: Super admin governance and oversight endpoints
 */

// PUBLIC ROUTES (No Auth Middleware)

/**
 * @swagger
 * /api/admin/request-otp:
 *   post:
 *     summary: Request OTP for admin login
 *     tags: [Admin Portal]
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
router.post('/request-otp', adminRequestOtp);

/**
 * @swagger
 * /api/admin/verify-otp:
 *   post:
 *     summary: Verify OTP and login as admin
 *     tags: [Admin Portal]
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
router.post('/verify-otp', adminVerifyOtp);

// PROTECTED ROUTES (Middleware applied per route)

/**
 * @swagger
 * /api/admin/pending-hospitals:
 *   get:
 *     summary: List hospitals awaiting verification
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of pending hospitals }
 */
router.get('/pending-hospitals', protect, admin, getPendingHospitals);

/**
 * @swagger
 * /api/admin/approve-hospital/{id}:
 *   post:
 *     summary: Approve hospital registration
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
router.post('/approve-hospital/:id', protect, admin, approveHospital);

/**
 * @swagger
 * /api/admin/pending-labs:
 *   get:
 *     summary: List labs awaiting verification
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of pending labs }
 */
router.get('/pending-labs', protect, admin, getPendingLabs);

/**
 * @swagger
 * /api/admin/approve-lab/{id}:
 *   post:
 *     summary: Approve lab registration
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
router.post('/approve-lab/:id', protect, admin, approveLab);

/**
 * @swagger
 * /api/admin/pending-doctors:
 *   get:
 *     summary: List doctors awaiting verification
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of pending doctors }
 */
router.get('/pending-doctors', protect, admin, getPendingDoctors);

/**
 * @swagger
 * /api/admin/approve-doctor/{id}:
 *   post:
 *     summary: Approve doctor registration
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
router.post('/approve-doctor/:id', protect, admin, approveDoctor);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all system users (excludes admins)
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of users }
 */
router.get('/users', protect, admin, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Update user account status (Active/Suspended)
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/users/:id/status', protect, admin, updateUserStatus);

/**
 * @swagger
 * /api/admin/reports/system:
 *   get:
 *     summary: Get system-wide platform analytics
 *     tags: [Admin Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Analytics data }
 */
router.get('/reports/system', protect, admin, getSystemAnalytics);

module.exports = router;

