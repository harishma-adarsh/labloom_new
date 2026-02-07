const Booking = require('../models/Booking');
const Lab = require('../models/Lab');
const User = require('../models/User');

// @desc    Get lab bookings
// @route   GET /api/lab/bookings
// @access  Private (Lab staff)
const getLabBookings = async (req, res) => {
    try {
        const { status, date, page = 1, limit = 20 } = req.query;

        // In a real app, staff would belong to a specific lab
        // We assume req.user.entityReference points to the Lab ID if they are lab role
        const labId = req.user.entityReference;

        if (!labId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'User not associated with a lab' });
        }

        let filter = {
            bookingType: 'test'
        };

        if (req.user.role !== 'admin') {
            // filter.lab = labId; // If we had a lab field in Booking, which we should add or use 'test' to find lab
            // For now, let's assume all lab tests are visible to the assigned lab
        }

        if (status) {
            filter.status = status;
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            filter.date = { $gte: startOfDay, $lte: endOfDay };
        }

        const bookings = await Booking.find(filter)
            .populate('user', 'name phone email')
            .populate('test', 'name category')
            .sort({ date: 1, time: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Booking.countDocuments(filter);

        res.json({
            bookings,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add offline booking
// @route   POST /api/lab/bookings
// @access  Private (Lab staff)
const addOfflineBooking = async (req, res) => {
    try {
        const { patientName, patientPhone, testId, date, time, notes } = req.body;

        // Check if user exists, else create a dummy or partial user
        let user = await User.findOne({ phone: patientPhone });
        if (!user) {
            user = await User.create({
                name: patientName,
                phone: patientPhone,
                role: 'patient'
            });
        }

        const booking = await Booking.create({
            user: user._id,
            test: testId,
            bookingType: 'test',
            date,
            time,
            notes,
            status: 'pending'
        });

        res.status(201).json(booking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update sample/booking status
// @route   PATCH /api/lab/bookings/:id/status
// @access  Private (Lab staff)
const updateLabStatus = async (req, res) => {
    try {
        const { status } = req.body;
        // Valid statuses: Collected, In-Lab, Validating, completed

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = status;
        await booking.save();

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload test report
// @route   POST /api/lab/reports/upload
// @access  Private (Lab staff)
const uploadReport = async (req, res) => {
    try {
        const { bookingId, reportUrl, results } = req.body;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.labReport = {
            reportUrl,
            resultDate: Date.now(),
            status: 'Pending Validation',
            results // JSON representation of findings
        };

        await booking.save();

        res.json({ message: 'Report uploaded, awaiting validation', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Validate report
// @route   POST /api/lab/reports/:id/validate
// @access  Private (Pathologist)
const validateReport = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking || !booking.labReport) {
            return res.status(404).json({ message: 'Report not found' });
        }

        booking.labReport.status = 'Validated';
        booking.status = 'completed';

        await booking.save();

        res.json({ message: 'Report validated and released', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get lab staff
// @route   GET /api/lab/staff
// @access  Private (Lab admin)
const getLabStaff = async (req, res) => {
    try {
        const labId = req.user.entityReference;
        const lab = await Lab.findById(labId).populate('staff.userId', 'name email phone');

        if (!lab) {
            return res.status(404).json({ message: 'Lab not found' });
        }

        res.json(lab.staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add lab staff
// @route   POST /api/lab/staff
// @access  Private (Lab admin)
const addLabStaff = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;
        const labId = req.user.entityReference;

        const lab = await Lab.findById(labId);
        if (!lab) return res.status(404).json({ message: 'Lab not found' });

        // Create user for staff
        const user = await User.create({
            name,
            email,
            phone,
            password, // Should be hashed in pre-save hook in real app or manually here
            role: 'lab',
            entityReference: labId,
            entityModel: 'Lab'
        });

        lab.staff.push({
            userId: user._id,
            role: role // technician, pathologist, etc.
        });

        await lab.save();

        res.status(201).json({ message: 'Staff added successfully', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update lab settings
// @route   PATCH /api/lab/settings
// @access  Private (Lab admin)
const updateLabSettings = async (req, res) => {
    try {
        const labId = req.user.entityReference;
        const updates = req.body;

        const lab = await Lab.findByIdAndUpdate(labId, updates, { new: true });

        if (!lab) {
            return res.status(404).json({ message: 'Lab not found' });
        }

        res.json(lab);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getLabBookings,
    addOfflineBooking,
    updateLabStatus,
    uploadReport,
    validateReport,
    getLabStaff,
    addLabStaff,
    updateLabSettings
};
