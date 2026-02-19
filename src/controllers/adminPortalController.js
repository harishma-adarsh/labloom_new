const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Lab = require('../models/Lab');
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ===== PREDEFINED ADMIN CREDENTIALS =====
const ADMIN_PHONE = '1234567890';
const ADMIN_NAME = 'Super Admin';
const ADMIN_EMAIL = 'admin@labloom.com';
const FIXED_OTP = '1234';
// =========================================

// Generate JWT token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

// @desc    Seed admin user (auto-creates if not exists)
const seedAdmin = async () => {
    try {
        // 1. Remove ANY OTHER users that might have the admin phone or email
        // and are NOT already the admin with the correct phone/email
        await User.deleteMany({
            $or: [{ phone: ADMIN_PHONE }, { email: ADMIN_EMAIL }],
            role: { $ne: 'admin' }
        });

        // 2. Now try to find the admin
        let admin = await User.findOne({
            $or: [{ phone: ADMIN_PHONE }, { email: ADMIN_EMAIL }]
        });

        if (admin) {
            // Update existing admin
            admin.role = 'admin';
            admin.name = ADMIN_NAME;
            admin.phone = ADMIN_PHONE;
            admin.email = ADMIN_EMAIL;
            admin.isActive = true;
            admin.password = undefined; // Enforce OTP login
            await admin.save();
            console.log('✅ Admin credentials synced: ' + ADMIN_PHONE);
        } else {
            // Create new admin
            await User.create({
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                phone: ADMIN_PHONE,
                role: 'admin',
                isActive: true
            });
            console.log('✅ Admin user created: ' + ADMIN_PHONE);
        }
    } catch (error) {
        console.error('Final Admin seed error:', error.message);
        // Fallback: One last attempt with findOneAndUpdate if save failed
        try {
            await User.findOneAndUpdate(
                { email: ADMIN_EMAIL },
                { phone: ADMIN_PHONE, role: 'admin', name: ADMIN_NAME, isActive: true },
                { upsert: true }
            );
        } catch (innerError) {
            console.error('Forceful admin update failed:', innerError.message);
        }
    }
};

// @desc    Admin request OTP
// @route   POST /api/admin/request-otp
// @access  Public
const adminRequestOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        // Only allow predefined admin phone
        if (phone !== ADMIN_PHONE) {
            return res.status(401).json({ message: 'Not authorized as admin' });
        }

        // Find or create admin
        let admin = await User.findOne({ phone: ADMIN_PHONE, role: 'admin' });
        if (!admin) {
            await seedAdmin();
            admin = await User.findOne({ phone: ADMIN_PHONE, role: 'admin' });
        }

        // Set fixed OTP
        admin.otp = FIXED_OTP;
        admin.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await admin.save();

        console.log(`### Admin OTP for ${phone}: ${FIXED_OTP} ###`);

        res.json({ message: 'Admin OTP sent successfully', otp: FIXED_OTP });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin verify OTP and login
// @route   POST /api/admin/verify-otp
// @access  Public
const adminVerifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: 'Phone and OTP are required' });
        }

        if (phone !== ADMIN_PHONE) {
            return res.status(401).json({ message: 'Not authorized as admin' });
        }

        const admin = await User.findOne({ phone: ADMIN_PHONE, role: 'admin' });

        if (!admin) {
            return res.status(404).json({ message: 'Admin account not found' });
        }

        if (admin.otp !== otp || admin.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP
        admin.otp = undefined;
        admin.otpExpires = undefined;
        await admin.save();

        const token = generateToken(admin._id, admin.role);

        res.json({
            message: 'Admin login successful',
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            role: admin.role,
            accessToken: token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

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

        // Sync with User table: set privacyPolicyAccepted to true (Approval flag)
        await User.findOneAndUpdate(
            { entityReference: hospital._id, role: 'hospital' },
            { privacyPolicyAccepted: true }
        );

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

        // Sync with User table: set privacyPolicyAccepted to true (Approval flag)
        await User.findOneAndUpdate(
            { entityReference: lab._id, role: 'lab' },
            { privacyPolicyAccepted: true }
        );

        res.json({ message: 'Lab approved successfully', lab });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get pending doctors
// @route   GET /api/admin/pending-doctors
// @access  Private (Admin)
const getPendingDoctors = async (req, res) => {
    try {
        const doctors = await User.find({
            role: 'doctor',
            'doctorProfile.verificationStatus': 'pending'
        });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve doctor
// @route   POST /api/admin/approve-doctor/:id
// @access  Private (Admin)
const approveDoctor = async (req, res) => {
    try {
        const doctor = await User.findById(req.params.id);
        if (!doctor || doctor.role !== 'doctor') {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        doctor.doctorProfile.verificationStatus = 'approved';
        doctor.privacyPolicyAccepted = true; // Approval flag
        await doctor.save();

        res.json({ message: 'Doctor approved successfully', doctor });
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

        // Exclude admins from the general user list
        let filter = { role: { $ne: 'admin' } };

        if (role && role !== 'admin') {
            filter.role = role;
        } else if (role === 'admin') {
            // Prevent fetching admins even if explicitly requested via query
            filter.role = 'none';
        }
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
    adminRequestOtp,
    adminVerifyOtp,
    seedAdmin,
    getPendingHospitals,
    approveHospital,
    getPendingLabs,
    approveLab,
    getPendingDoctors,
    approveDoctor,
    getAllUsers,
    updateUserStatus,
    getSystemAnalytics
};
