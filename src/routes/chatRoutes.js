const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Messaging between patients and doctors
 */

/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     summary: Send a message
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId: { type: string }
 *               content: { type: string }
 *               type: { type: string, enum: [text, image, file] }
 *     responses:
 *       201: { description: Message sent }
 */
router.post('/send', protect, sendMessage);

/**
 * @swagger
 * /api/chat/{bookingId}:
 *   get:
 *     summary: Get chat history
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of messages }
 */
router.get('/:bookingId', protect, getChatHistory);

module.exports = router;
