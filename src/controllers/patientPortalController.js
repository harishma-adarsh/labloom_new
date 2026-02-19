const Booking = require('../models/Booking');
const Metric = require('../models/Metric');
const Lab = require('../models/Lab');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Review = require('../models/Review');
const Test = require('../models/Test');
const User = require('../models/User');

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


// @desc    Get tests for a specific lab
// @route   GET /api/patients/labs/:id/tests
// @access  Public
const getLabTests = async (req, res) => {
    try {
        const lab = await Lab.findById(req.params.id).populate({
            path: 'availableTests.testId',
            model: 'Test'
        });

        if (!lab) {
            return res.status(404).json({ message: 'Lab not found' });
        }

        // Format response to include price and turnaround from Lab specific info
        const tests = lab.availableTests.map(item => ({
            _id: item.testId._id,
            name: item.testId.name,
            description: item.testId.description,
            category: item.testId.category,
            image: item.testId.image,
            price: item.price, // Lab specific price
            turnaroundTime: item.turnaroundTime // Lab specific time
        }));

        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get popular hospitals
// @route   GET /api/patients/hospitals/popular
// @access  Public
const getPopularHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find({ verificationStatus: 'approved' })
            .sort({ rating: -1, reviewsCount: -1 })
            .limit(5)
            .select('name address rating reviewsCount image departments type');

        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get available slots for a doctor
// @route   GET /api/patients/doctors/:id/slots
// @access  Public
const getDoctorSlots = async (req, res) => {
    try {
        const { date } = req.query; // Expect YYYY-MM-DD
        const doctorId = req.params.id;

        if (!date) {
            return res.status(400).json({ message: 'Date query parameter is required' });
        }

        // Generate slots (9 AM to 5 PM, 30 min intervals)
        const slots = [];
        const startHour = 9;
        const endHour = 17;

        for (let i = startHour; i < endHour; i++) {
            slots.push(`${i.toString().padStart(2, '0')}:00`);
            slots.push(`${i.toString().padStart(2, '0')}:30`);
        }

        // Check existing bookings for this doctor on this date
        const queryDate = new Date(date);
        const nextDate = new Date(queryDate);
        nextDate.setDate(queryDate.getDate() + 1);

        const bookings = await Booking.find({
            doctor: doctorId,
            date: {
                $gte: queryDate,
                $lt: nextDate
            },
            status: { $ne: 'cancelled' }
        });

        // Map booked times
        // Assuming Booking has a 'time' field or we parse it from 'date'
        // If Booking only has 'date' which includes time, we extract time.
        // Let's assume schema stores full date object.

        const bookedTimes = bookings.map(b => {
            const d = new Date(b.date);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        });

        // Filter available slots
        const availableSlots = slots.map(time => ({
            time,
            isAvailable: !bookedTimes.includes(time)
        }));

        res.json(availableSlots);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit feedback/review
// @route   POST /api/patients/feedback
// @access  Private
const submitFeedback = async (req, res) => {
    try {
        const { targetId, targetType, rating, comment } = req.body;
        // targetType: 'doctor', 'lab', 'hospital'

        if (!targetId || !targetType || !rating || !comment) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const reviewData = {
            user: req.user.id,
            rating,
            comment
        };

        if (targetType === 'doctor') reviewData.doctor = targetId;
        else if (targetType === 'lab') reviewData.lab = targetId;
        else if (targetType === 'hospital') reviewData.hospital = targetId;
        else return res.status(400).json({ message: 'Invalid target type' });

        const review = await Review.create(reviewData);

        // Update entity rating
        let Model;
        if (targetType === 'doctor') Model = Doctor;
        if (targetType === 'lab') Model = Lab;
        if (targetType === 'hospital') Model = Hospital;

        if (Model) {
            const reviews = await Review.find({ [targetType]: targetId });
            const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

            await Model.findByIdAndUpdate(targetId, {
                rating: avgRating,
                reviewsCount: reviews.length
            });
        }

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reviews for an entity
// @route   GET /api/patients/reviews
// @access  Public
const getReviews = async (req, res) => {
    try {
        const { targetId, targetType } = req.query;
        let query = {};

        if (targetType === 'doctor') query.doctor = targetId;
        else if (targetType === 'lab') query.lab = targetId;
        else if (targetType === 'hospital') query.hospital = targetId;
        else return res.status(400).json({ message: 'Invalid target type' });

        const reviews = await Review.find(query)
            .populate('user', 'name firstName lastName image')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload profile image
// @route   POST /api/patients/upload-profile-image
// @access  Private
const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Construct file path
        // Assuming express.static is serving 'uploads' folder
        const imagePath = `/uploads/${req.file.filename}`;

        const user = await User.findById(req.user.id);
        if (user) {
            user.image = imagePath;
            await user.save();
        }

        res.json({
            message: 'Image uploaded successfully',
            imageUrl: imagePath
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPatientDashboard,
    getLabs,
    getLabTests,
    getPopularHospitals,
    getDoctorSlots,
    submitFeedback,
    getReviews,
    uploadProfileImage
};
