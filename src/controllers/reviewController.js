const Review = require('../models/Review');
const Doctor = require('../models/Doctor');

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
    const { doctorId, rating, comment } = req.body;

    if (!doctorId || !rating || !comment) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    try {
        // Create review
        const review = await Review.create({
            user: req.user.id,
            doctor: doctorId,
            rating: Number(rating),
            comment
        });

        // Calculate new average rating for the doctor
        const doctor = await Doctor.findById(doctorId);

        if (doctor) {
            const reviews = await Review.find({ doctor: doctorId });

            doctor.reviewsCount = reviews.length;
            doctor.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

            await doctor.save();
        }

        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get reviews for a doctor
// @route   GET /api/reviews/:doctorId
// @access  Public
const getDoctorReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ doctor: req.params.doctorId })
            .populate('user', 'name firstName lastName image') // Get user details
            .sort({ createdAt: -1 }); // Newest first

        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createReview,
    getDoctorReviews,
};
