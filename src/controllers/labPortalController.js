const Booking = require('../models/Booking');
const Lab = require('../models/Lab');
const Test = require('../models/Test');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// @desc    Get lab bookings
// @route   GET /api/lab/bookings
// @access  Private (Lab staff)
const getLabBookings = async (req, res) => {
    try {
        const { status, date, page = 1, limit = 20 } = req.query;
        const labId = req.user.entityReference;

        if (!labId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'User not associated with a lab' });
        }

        let filter = {
            bookingType: 'test'
        };

        // Filter by lab
        if (req.user.role !== 'admin' && labId) {
            filter.lab = labId;
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
            .populate('lab', 'name')
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

// @desc    Get pending lab bookings
// @route   GET /api/lab/bookings/pending
// @access  Private (Lab staff)
const getPendingBookings = async (req, res) => {
    try {
        const labId = req.user.entityReference;

        if (!labId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'User not associated with a lab' });
        }

        let filter = {
            bookingType: 'test',
            status: { $in: ['pending', 'confirmed'] }
        };

        if (req.user.role !== 'admin' && labId) {
            filter.lab = labId;
        }

        const bookings = await Booking.find(filter)
            .populate('user', 'name phone email image')
            .populate('test', 'name category price duration')
            .populate('lab', 'name address')
            .sort({ date: 1, time: 1 });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add offline booking
// @route   POST /api/lab/bookings
// @access  Private (Lab staff)
const addOfflineBooking = async (req, res) => {
    try {
        const { patientName, patientPhone, testId, date, time, notes, amount } = req.body;
        const labId = req.user.entityReference;

        // Check if user exists, else create a dummy or partial user
        let user = await User.findOne({ phone: patientPhone });
        if (!user) {
            user = await User.create({
                name: patientName,
                phone: patientPhone,
                role: 'patient'
            });
        }

        const platformFee = 50;
        const labAmount = (amount || 0) - platformFee;

        const booking = await Booking.create({
            user: user._id,
            test: testId,
            lab: labId,
            bookingType: 'test',
            date,
            time,
            notes,
            status: 'pending',
            amount: amount || 0,
            platformFee,
            revenue: {
                labAmount: labAmount > 0 ? labAmount : 0,
                adminAmount: platformFee
            }
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
        // Valid statuses: pending, confirmed, completed, cancelled, test_not_done

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Map "Test Not Done" → 'test_not_done', "Completed" → 'completed'
        booking.status = status;
        await booking.save();

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload test report for a specific booking
// @route   POST /api/lab/bookings/:id/upload-report
// @access  Private (Lab staff)
const uploadBookingReport = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status !== 'completed') {
            return res.status(400).json({ message: 'Booking must be completed before uploading a report' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const reportUrl = `/uploads/reports/${req.file.filename}`;

        booking.labReport = {
            reportUrl,
            resultDate: Date.now(),
            status: 'Normal Results'
        };

        await booking.save();

        res.json({ message: 'Report uploaded successfully', reportUrl, booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload test report (legacy)
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
            results
        };

        await booking.save();

        res.json({ message: 'Report uploaded, awaiting validation', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download finalized report
// @route   GET /api/lab/reports/:bookingId/download
// @access  Private
const downloadReport = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (!booking.labReport || !booking.labReport.reportUrl) {
            return res.status(404).json({ message: 'Report not available yet' });
        }

        // Return the report URL for the client to download
        res.json({
            reportUrl: booking.labReport.reportUrl,
            status: booking.labReport.status,
            resultDate: booking.labReport.resultDate
        });
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

// @desc    Get lab catalog (tests offered by the lab)
// @route   GET /api/lab/catalog
// @access  Private (Lab staff)
const getLabCatalog = async (req, res) => {
    try {
        const labId = req.user.entityReference;

        const lab = await Lab.findById(labId).populate({
            path: 'availableTests.testId',
            model: 'Test'
        });

        if (!lab) {
            return res.status(404).json({ message: 'Lab not found' });
        }

        const catalog = lab.availableTests.map(item => ({
            _id: item._id,
            testId: item.testId?._id,
            name: item.testId?.name,
            description: item.testId?.description,
            category: item.testId?.category,
            price: item.price,
            turnaroundTime: item.turnaroundTime
        }));

        res.json(catalog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add test to lab catalog
// @route   POST /api/lab/catalog
// @access  Private (Lab admin)
const addToCatalog = async (req, res) => {
    try {
        const { testId, price, turnaroundTime } = req.body;
        const labId = req.user.entityReference;

        const lab = await Lab.findById(labId);
        if (!lab) return res.status(404).json({ message: 'Lab not found' });

        // Check if test already in catalog
        const existing = lab.availableTests.find(t => t.testId.toString() === testId);
        if (existing) {
            return res.status(400).json({ message: 'Test already in catalog' });
        }

        lab.availableTests.push({ testId, price, turnaroundTime });
        await lab.save();

        res.status(201).json({ message: 'Test added to catalog', catalog: lab.availableTests });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update test in lab catalog
// @route   PATCH /api/lab/catalog/:testEntryId
// @access  Private (Lab admin)
const updateCatalogEntry = async (req, res) => {
    try {
        const { price, turnaroundTime } = req.body;
        const labId = req.user.entityReference;

        const lab = await Lab.findById(labId);
        if (!lab) return res.status(404).json({ message: 'Lab not found' });

        const entry = lab.availableTests.id(req.params.testEntryId);
        if (!entry) {
            return res.status(404).json({ message: 'Test entry not found in catalog' });
        }

        if (price !== undefined) entry.price = price;
        if (turnaroundTime !== undefined) entry.turnaroundTime = turnaroundTime;

        await lab.save();

        res.json({ message: 'Catalog entry updated', entry });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove test from lab catalog
// @route   DELETE /api/lab/catalog/:testEntryId
// @access  Private (Lab admin)
const removeFromCatalog = async (req, res) => {
    try {
        const labId = req.user.entityReference;

        const lab = await Lab.findById(labId);
        if (!lab) return res.status(404).json({ message: 'Lab not found' });

        const entry = lab.availableTests.id(req.params.testEntryId);
        if (!entry) {
            return res.status(404).json({ message: 'Test entry not found' });
        }

        entry.deleteOne();
        await lab.save();

        res.json({ message: 'Test removed from catalog' });
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
            password,
            role: 'lab',
            entityReference: labId,
            entityModel: 'Lab'
        });

        lab.staff.push({
            userId: user._id,
            role: role
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
    getPendingBookings,
    addOfflineBooking,
    updateLabStatus,
    uploadBookingReport,
    uploadReport,
    downloadReport,
    validateReport,
    getLabCatalog,
    addToCatalog,
    updateCatalogEntry,
    removeFromCatalog,
    getLabStaff,
    addLabStaff,
    updateLabSettings
};
