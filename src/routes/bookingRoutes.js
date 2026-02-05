const express = require('express');
const router = express.Router();
const {
    createBooking,
    getMyBookings,
    getVisitSummaries,
    updateVisitSummary
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Booking created
 */
router.post('/', protect, createBooking);
/**
 * @swagger
 * /api/bookings/my:
 *   get:
 *     summary: Get my bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get('/my', protect, getMyBookings);
/**
 * @swagger
 * /api/bookings/summaries:
 *   get:
 *     summary: Get visit summaries
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of visit summaries
 */
router.get('/summaries', protect, getVisitSummaries); // Search/Filter List
/**
 * @swagger
 * /api/bookings/{id}/summary:
 *   put:
 *     summary: Update visit summary
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary updated
 */
router.put('/:id/summary', protect, updateVisitSummary); // Add Summary Details

module.exports = router;
