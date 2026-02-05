const express = require('express');
const router = express.Router();
const { getPaymentMethods, addPaymentMethod, deletePaymentMethod } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/methods', protect, getPaymentMethods);
router.post('/methods', protect, addPaymentMethod);
router.delete('/methods/:id', protect, deletePaymentMethod);

module.exports = router;
