const express = require('express');
const router = express.Router();
const {
    getLabBookings,
    addOfflineBooking,
    updateLabStatus,
    uploadReport,
    validateReport,
    getLabStaff,
    addLabStaff,
    updateLabSettings
} = require('../controllers/labPortalController');
const { protect, verifyLab, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorizeRoles('lab', 'admin'));

/**
 * @swagger
 * tags:
 *   name: Lab Portal
 *   description: Endpoints for lab diagnostic centers and test management
 */

/**
 * @swagger
 * /api/lab/bookings:
 *   get:
 *     summary: List test bookings by status or date
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of bookings }
 */
router.get('/bookings', getLabBookings);

/**
 * @swagger
 * /api/lab/bookings:
 *   post:
 *     summary: Add offline/manual booking for walk-in patient
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201: { description: Booking created }
 */
router.post('/bookings', addOfflineBooking);

/**
 * @swagger
 * /api/lab/bookings/{id}/status:
 *   patch:
 *     summary: Update sample status (Collected/In-Lab/etc.)
 *     tags: [Lab Portal]
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
 *             properties: { status: { type: string } }
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/bookings/:id/status', updateLabStatus);

/**
 * @swagger
 * /api/lab/reports/upload:
 *   post:
 *     summary: Upload digitized report file
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Report uploaded }
 */
router.post('/reports/upload', uploadReport);

/**
 * @swagger
 * /api/lab/reports/{id}/validate:
 *   post:
 *     summary: Final pathologist approval
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Report validated }
 */
router.post('/reports/:id/validate', validateReport);

/**
 * @swagger
 * /api/lab/staff:
 *   get:
 *     summary: List lab technicians and pathologists
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Staff list }
 */
router.get('/staff', getLabStaff);

/**
 * @swagger
 * /api/lab/staff:
 *   post:
 *     summary: Register new staff member
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201: { description: Staff registered }
 */
router.post('/staff', addLabStaff);

/**
 * @swagger
 * /api/lab/settings:
 *   patch:
 *     summary: Update lab configuration
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Settings updated }
 */
router.patch('/settings', updateLabSettings);

module.exports = router;
