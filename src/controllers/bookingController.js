const Booking = require('../models/Booking');

const PLATFORM_FEE = 50; // ₹50 platform fee

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    const { testId, labId, doctorId, bookingType, date, time, appointmentMode, notes, amount } = req.body;

    // Validation
    if (!date) {
        return res.status(400).json({ message: 'Date is required' });
    }

    if (bookingType === 'doctor') {
        if (!doctorId || !time || !appointmentMode) {
            return res.status(400).json({ message: 'Doctor, Time, and Mode are required for doctor bookings' });
        }
    } else {
        // Default to test if no type provided or type is 'test'
        if (!testId) {
            return res.status(400).json({ message: 'Test ID is required for lab bookings' });
        }
    }

    try {
        // Revenue splitting
        let revenue = {};
        let totalAmount = amount || 0;
        let platformFee = 0;

        if (bookingType === 'test' || !bookingType) {
            // Lab booking: Base price → Lab, ₹50 → Admin
            platformFee = PLATFORM_FEE;
            const labAmount = totalAmount - platformFee;
            revenue = {
                labAmount: labAmount > 0 ? labAmount : 0,
                adminAmount: platformFee
            };
        } else if (bookingType === 'doctor') {
            // Doctor booking: Consultation fee → Hospital revenue
            revenue = {
                hospitalAmount: totalAmount
            };
        }

        const booking = await Booking.create({
            user: req.user.id,
            test: testId || undefined,
            lab: labId || undefined,
            doctor: doctorId || undefined,
            bookingType: bookingType || 'test',
            date,
            time,
            appointmentMode,
            notes,
            amount: totalAmount,
            platformFee,
            revenue
        });

        res.status(201).json(booking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get logged in user bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('test')
            .populate('doctor');
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get visit summaries with filter/search/sort
// @route   GET /api/bookings/summaries
// @access  Private
const getVisitSummaries = async (req, res) => {
    try {
        const { query, type, specialization, sort } = req.query;

        // Base filter: Current user and completed status (summaries only exist for completed visits)
        let filter = {
            user: req.user.id,
            status: 'completed',
            visitSummary: { $exists: true } // Ensure summary exists
        };

        // Filter by Appointment Type (Virtual/In-person)
        if (type && type !== 'All') {
            filter.appointmentMode = type === 'Virtual' ? 'Video call' : 'In-person';
        }

        // Build query
        // We need to populate first to check doctor details for some filters
        let bookings = await Booking.find(filter)
            .populate('doctor')
            .populate('test');

        // Filter by Specialization (requires populated doctor)
        if (specialization) {
            bookings = bookings.filter(b => b.doctor && b.doctor.specialization === specialization);
        }

        // Search Text (Doctor Name or Specialization)
        if (query) {
            const regex = new RegExp(query, 'i');
            bookings = bookings.filter(b =>
                (b.doctor && b.doctor.name.match(regex)) ||
                (b.doctor && b.doctor.specialization.match(regex))
            );
        }

        // Sorting
        if (sort === 'Alphabet: from A>Z') {
            bookings.sort((a, b) => {
                const nameA = a.doctor ? a.doctor.name : '';
                const nameB = b.doctor ? b.doctor.name : '';
                return nameA.localeCompare(nameB);
            });
        } else {
            // Default: Recent first ("Date: Recent first")
            bookings.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add/Update visit summary (Doctor side simulation)
// @route   PUT /api/bookings/:id/summary
// @access  Private
const updateVisitSummary = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Ensure we merge existing summary data if we are doing partial updates, 
        // OR just overwrite. For simplicity, we overwrite with whatever is passed,
        // but preserving fields not sent would require deeper merge logic.
        // Mongoose handles minimal updates if we assign properties directly.

        booking.visitSummary = req.body;
        booking.status = 'completed'; // Automatically mark as completed

        await booking.save();
        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    getVisitSummaries,
    updateVisitSummary
};