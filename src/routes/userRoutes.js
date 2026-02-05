const express = require('express');
const router = express.Router();
const { toggleFavorite, getFavorites } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/favorites', protect, getFavorites);
router.put('/favorites/:doctorId', protect, toggleFavorite);

module.exports = router;
