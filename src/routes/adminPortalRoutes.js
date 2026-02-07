const express = require('express');
const router = express.Router();
const {
    getPendingHospitals,
    approveHospital,
    getPendingLabs,
    approveLab,
    getAllUsers,
    updateUserStatus,
    getSystemAnalytics
} = require('../controllers/adminPortalController');
const { protect, admin } = require('../middleware/authMiddleware');

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
