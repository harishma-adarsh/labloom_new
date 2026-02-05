const Metric = require('../models/Metric');

// @desc    Add new health metric record
// @route   POST /api/metrics
// @access  Private
const addMetric = async (req, res) => {
    try {
        const { type, value, value2, unit, date, notes } = req.body;

        if (!type || !value || !unit) {
            return res.status(400).json({ message: 'Type, value, and unit are required' });
        }

        const metric = await Metric.create({
            user: req.user.id,
            type,
            value,
            value2,
            unit,
            date: date || new Date(),
            notes
        });

        res.status(201).json(metric);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get history for a specific metric type (for charts)
// @route   GET /api/metrics/:type
// @access  Private
const getMetricHistory = async (req, res) => {
    try {
        const metrics = await Metric.find({
            user: req.user.id,
            type: req.params.type
        }).sort({ date: -1 });

        res.status(200).json(metrics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get latest values for all metrics (Dashboard summary)
// @route   GET /api/metrics/summary/latest
// @access  Private
const getLatestMetrics = async (req, res) => {
    try {
        const types = ['Blood Pressure', 'Weight', 'Heart Rate', 'Blood Sugar', 'Temperature'];
        const latestMetrics = {};

        for (const type of types) {
            const latest = await Metric.findOne({
                user: req.user.id,
                type
            }).sort({ date: -1 });

            if (latest) {
                latestMetrics[type] = latest;
            }
        }

        res.status(200).json(latestMetrics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addMetric,
    getMetricHistory,
    getLatestMetrics
};
