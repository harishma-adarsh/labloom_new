const express = require('express');
const router = express.Router();
const { submitFeedback, getReviews } = require('../controllers/patientPortalController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Universal feedback/review system for labs, doctors, and hospitals
 */

/**
 * @swagger
 * /api/feedback/submit:
 *   post:
 *     summary: Submit ratings and comments
 *     tags: [Feedback]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetId, targetType, rating, comment]
 *             properties:
 *               targetId: { type: string }
 *               targetType: { type: string, enum: [lab, doctor, hospital] }
 *               rating: { type: number, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       201: { description: Feedback submitted }
 */
router.post('/submit', protect, submitFeedback);

/**
 * @swagger
 * /api/feedback/{targetId}:
 *   get:
 *     summary: Retrieve reviews for a specific entity
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: targetType
 *         required: true
 *         schema: { type: string, enum: [lab, doctor, hospital] }
 *     responses:
 *       200: { description: List of reviews }
 */
router.get('/:targetId', async (req, res) => {
    // Adapt path param to query param for the shared controller
    req.query.targetId = req.params.targetId;
    const { getReviews } = require('../controllers/patientPortalController');
    return getReviews(req, res);
});

module.exports = router;
