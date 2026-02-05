const express = require('express');
const router = express.Router();
const { addMetric, getMetricHistory, getLatestMetrics } = require('../controllers/metricController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addMetric);
router.get('/summary/latest', protect, getLatestMetrics);
router.get('/:type', protect, getMetricHistory);

module.exports = router;
