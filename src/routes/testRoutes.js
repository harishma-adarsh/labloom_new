const express = require('express');
const router = express.Router();
const { getTests, createTest, updateTest, deleteTest, getTestById, seedTests } = require('../controllers/testController');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/tests:
 *   get:
 *     summary: Get all tests
 *     tags: [Tests]
 *     responses:
 *       200:
 *         description: List of tests
 *   post:
 *     summary: Create a test (Admin only)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Test created
 */
router.route('/').get(getTests).post(protect, admin, createTest);

/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     summary: Get test by ID
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test data
 */
router.route('/:id').get(getTestById).put(protect, updateTest).delete(protect, deleteTest);

/**
 * @swagger
 * /api/tests/seed:
 *   post:
 *     summary: Seed sample tests
 *     tags: [Tests]
 *     responses:
 *       200:
 *         description: Tests seeded
 */
router.post('/seed', seedTests);

module.exports = router;
