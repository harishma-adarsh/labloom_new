const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Lab = require('../models/Lab');
const Booking = require('../models/Booking');

// @desc    Get pending hospitals
// @route   GET /api/admin/pending-hospitals
// @access  Private (Admin)
const getPendingHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find({ verificationStatus: 'pending' });
        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve hospital
// @route   POST /api/admin/approve-hospital/:id
// @access  Private (Admin)
const approveHospital = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

        hospital.verificationStatus = 'approved';
        hospital.verifiedBy = req.user.id;
        hospital.verifiedAt = Date.now();
        await hospital.save();

        res.json({ message: 'Hospital approved successfully', hospital });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get pending labs
// @route   GET /api/admin/pending-labs
// @access  Private (Admin)
const getPendingLabs = async (req, res) => {
    try {
        const labs = await Lab.find({ verificationStatus: 'pending' });
        res.json(labs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve lab
// @route   POST /api/admin/approve-lab/:id
// @access  Private (Admin)
const approveLab = async (req, res) => {
    try {
        const lab = await Lab.findById(req.params.id);
        if (!lab) return res.status(404).json({ message: 'Lab not found' });

        lab.verificationStatus = 'approved';
        lab.verifiedBy = req.user.id;
        lab.verifiedAt = Date.now();
        await lab.save();

        res.json({ message: 'Lab approved successfully', lab });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        let filter = {};

        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(filter)
            .select('-password -otp')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await User.countDocuments(filter);

        res.json({
            users,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // In User model, we should add isActive field if not present
        // For now, let's assume we use 'suspended' role or a separate field
        user.isActive = isActive;
        await user.save();

        res.json({ message: `User status updated to ${isActive ? 'Active' : 'Suspended'}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get system analytics
// @route   GET /api/admin/reports/system
// @access  Private (Admin)
const getSystemAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'patient' });
        const totalDoctors = await User.countDocuments({ role: 'doctor' });
        const totalHospitals = await Hospital.countDocuments();
        const totalLabs = await Lab.countDocuments();

        const totalAppointments = await Booking.countDocuments({ bookingType: 'doctor' });
        const totalLabTests = await Booking.countDocuments({ bookingType: 'test' });

        res.json({
            users: {
                patients: totalUsers,
                doctors: totalDoctors,
                hospitals: totalHospitals,
                labs: totalLabs
            },
            activity: {
                appointments: totalAppointments,
                labTests: totalLabTests
            },
            growth: "12% increase from last month" // Dummy stat
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPendingHospitals,
    approveHospital,
    getPendingLabs,
    approveLab,
    getAllUsers,
    updateUserStatus,
    getSystemAnalytics
};
