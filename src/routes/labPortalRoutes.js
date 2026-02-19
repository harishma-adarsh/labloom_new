const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    getLabBookings,
    getPendingBookings,
    addOfflineBooking,
    updateLabStatus,
    uploadBookingReport,
    uploadReport,
    downloadReport,
    validateReport,
    getLabCatalog,
    addToCatalog,
    updateCatalogEntry,
    removeFromCatalog,
    getLabStaff,
    addLabStaff,
    updateLabSettings
} = require('../controllers/labPortalController');
const { protect, verifyLab, authorizeRoles } = require('../middleware/authMiddleware');

// Multer setup for report uploads (PDF)
const reportStorage = multer.diskStorage({
    destination: './uploads/reports/',
    filename: function (req, file, cb) {
        cb(null, 'report-' + Date.now() + path.extname(file.originalname));
    }
});
const reportUpload = multer({
    storage: reportStorage,
    limits: { fileSize: 20000000 }, // 20MB
    fileFilter: function (req, file, cb) {
        const filetypes = /pdf|jpg|jpeg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb('Error: PDF and image files only!');
    }
});

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
 * /api/lab/bookings/pending:
 *   get:
 *     summary: List upcoming/pending test bookings
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Pending bookings }
 */
router.get('/bookings/pending', getPendingBookings);

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
 *     summary: Update booking status (Completed / Test Not Done)
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, completed, cancelled, test_not_done]
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/bookings/:id/status', updateLabStatus);

/**
 * @swagger
 * /api/lab/bookings/{id}/upload-report:
 *   post:
 *     summary: Upload digital report for a specific booking (after completion)
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               report:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Report uploaded }
 */
router.post('/bookings/:id/upload-report', reportUpload.single('report'), uploadBookingReport);

/**
 * @swagger
 * /api/lab/reports/upload:
 *   post:
 *     summary: Upload digitized report file (legacy)
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
 * /api/lab/reports/{bookingId}/download:
 *   get:
 *     summary: Download finalized PDF report
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Report URL }
 */
router.get('/reports/:bookingId/download', downloadReport);

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
 * /api/lab/catalog:
 *   get:
 *     summary: Get lab test catalog
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lab catalog }
 */
router.get('/catalog', getLabCatalog);

/**
 * @swagger
 * /api/lab/catalog:
 *   post:
 *     summary: Add test to lab catalog
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               testId: { type: string }
 *               price: { type: number }
 *               turnaroundTime: { type: string }
 *     responses:
 *       201: { description: Test added }
 */
router.post('/catalog', addToCatalog);

/**
 * @swagger
 * /api/lab/catalog/{testEntryId}:
 *   patch:
 *     summary: Update price/turnaround for a test in catalog
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: testEntryId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price: { type: number }
 *               turnaroundTime: { type: string }
 *     responses:
 *       200: { description: Entry updated }
 */
router.patch('/catalog/:testEntryId', updateCatalogEntry);

/**
 * @swagger
 * /api/lab/catalog/{testEntryId}:
 *   delete:
 *     summary: Remove test from lab catalog
 *     tags: [Lab Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: testEntryId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Test removed }
 */
router.delete('/catalog/:testEntryId', removeFromCatalog);

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
