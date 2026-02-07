const Booking = require('../models/Booking');
const Metric = require('../models/Metric');
const Lab = require('../models/Lab');

// @desc    Get patient dashboard summary
// @route   GET /api/patients/dashboard
// @access  Private (Patient)
const getPatientDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        // Upcoming appointments
        const upcomingAppointments = await Booking.find({
            user: userId,
            date: { $gte: new Date() },
            status: 'pending'
        })
            .populate('doctor', 'name specialization image')
            .sort({ date: 1 })
            .limit(2);

        // Recent reports (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentReportsCount = await Booking.countDocuments({
            user: userId,
            bookingType: 'test',
            status: 'completed',
            updatedAt: { $gte: thirtyDaysAgo }
        });

        // Latest health metrics
        const latestMetrics = await Metric.find({ user: userId })
            .sort({ date: -1 })
            .limit(5);

        // Dummy health score calculation
        const healthScore = 85;

        res.json({
            upcomingAppointments,
            recentReportsCount,
            latestMetrics,
            healthScore,
            summary: "Your health score is consistent. Consider increasing water intake by 500ml daily."
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Find available labs
// @route   GET /api/labs
// @access  Public
const getLabs = async (req, res) => {
    try {
        const { city, search } = req.query;
        let filter = { verificationStatus: 'approved' };

        if (city) filter['address.city'] = { $regex: city, $options: 'i' };
        if (search) filter.name = { $regex: search, $options: 'i' };

        const labs = await Lab.find(filter)
            .select('name address phone availableTests rating reviewsCount image')
            .limit(20);

        res.json(labs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPatientDashboard,
    getLabs
};
