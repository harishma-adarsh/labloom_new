const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

// @desc    Get all Lab Reports (from direct tests and doctor visits)
// @route   GET /api/medical-records/lab-reports
// @access  Private
const getLabReports = async (req, res) => {
    try {
        // Filters: category (comma separated), resultType (Good, Borderline, Bad), sort
        const { category, resultType, sort } = req.query;

        // 1. Get Direct Lab Bookings
        const labBookings = await Booking.find({
            user: req.user.id,
            bookingType: 'test'
        }).populate('test');

        // 2. Get Doctor Visit Examinations
        const doctorBookings = await Booking.find({
            user: req.user.id,
            bookingType: 'doctor',
            'visitSummary.examinations': { $exists: true, $not: { $size: 0 } }
        }).populate('doctor');

        let reports = [];

        // Helper to map status to Result Type
        const getResultType = (status) => {
            if (!status) return 'Unknown';
            const s = status.toLowerCase();
            if (s.includes('normal')) return 'Good';
            if (s.includes('attention') || s.includes('follow-up')) return 'Borderline';
            if (s.includes('critical') || s.includes('abnormal')) return 'Bad';
            return 'Unknown';
        };

        // Process Lab Bookings
        labBookings.forEach(booking => {
            if (booking.test) {
                const status = booking.labReport?.status || ((booking.status === 'completed') ? 'Normal Results' : 'Pending');

                reports.push({
                    id: booking._id,
                    title: booking.test.name,
                    category: booking.test.category, // Used for filtering
                    date: booking.date,
                    status: status,
                    reportUrl: booking.labReport?.reportUrl,
                    resultDate: booking.labReport?.resultDate || new Date(new Date(booking.date).setDate(new Date(booking.date).getDate() + 1)),
                    type: 'lab_test',
                    image: booking.test.image
                });
            }
        });

        // Process Doctor Examinations
        doctorBookings.forEach(booking => {
            if (booking.visitSummary && booking.visitSummary.examinations) {
                booking.visitSummary.examinations.forEach(exam => {
                    reports.push({
                        id: booking._id + '_' + exam._id,
                        title: exam.testName,
                        category: 'Doctor Prescribed', // simplified for now, as exams don't link to 'Test' model directly usually
                        date: exam.date || booking.date,
                        status: exam.status || 'Normal Results',
                        reportUrl: exam.resultUrl,
                        type: 'doctor_exam',
                        doctorName: booking.doctor?.name
                    });
                });
            }
        });

        // --- FILTERING ---

        // Filter by Test Type (Category)
        if (category) {
            const categories = category.split(',').map(c => c.trim().toLowerCase());
            reports = reports.filter(r => r.category && categories.includes(r.category.toLowerCase()));
        }

        // Filter by Result Type (Good, Borderline, Bad)
        if (resultType) {
            const resultTypes = resultType.split(',').map(t => t.trim().toLowerCase()); // keys passed from UI
            reports = reports.filter(r => {
                const type = getResultType(r.status).toLowerCase();
                return resultTypes.includes(type);
            });
        }

        // --- SORTING ---
        if (sort === 'a-z') {
            reports.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            // Recent first
            reports.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all Prescriptions from Visit Summaries
// @route   GET /api/medical-records/prescriptions
// @access  Private
const getPrescriptions = async (req, res) => {
    try {
        const { query, tab, type, specialization, sort } = req.query;

        const bookings = await Booking.find({
            user: req.user.id,
            bookingType: 'doctor',
            'visitSummary.prescriptions': { $exists: true, $not: { $size: 0 } }
        }).populate('doctor');

        let prescriptions = [];

        bookings.forEach(booking => {
            if (booking.visitSummary && booking.visitSummary.prescriptions) {
                booking.visitSummary.prescriptions.forEach(rx => {
                    prescriptions.push({
                        id: booking._id + '_' + rx._id,
                        bookingId: booking._id,
                        medicationId: rx._id,
                        medication: rx.medication,
                        type: rx.type,
                        description: rx.description,
                        dosage: rx.dosage,
                        frequency: rx.frequency,
                        duration: rx.duration,
                        endDate: rx.endDate || booking.date, // Fallback to booking date if not set
                        specialInstructions: rx.specialInstructions,
                        storage: rx.storage,
                        sideEffects: rx.sideEffects,
                        allergyWarning: rx.allergyWarning,
                        refillStatus: rx.refillStatus,
                        doctorName: booking.doctor?.name,
                        date: booking.date,
                        specialization: booking.doctor?.specialization
                    });
                });
            }
        });

        // --- FILTERING ---

        // 1. Tab: Actual vs History (Based on End Date)
        const now = new Date();
        if (tab === 'history') {
            prescriptions = prescriptions.filter(p => new Date(p.endDate) < now);
        } else if (tab === 'actual') {
            prescriptions = prescriptions.filter(p => new Date(p.endDate) >= now);
        }

        // 2. Search Text (Medication Name)
        if (query) {
            const regex = new RegExp(query, 'i');
            prescriptions = prescriptions.filter(p => p.medication.match(regex));
        }

        // 3. Filter by Medication Type (Capsules, Tablets, etc.)
        if (type) {
            const types = type.split(',').map(t => t.trim().toLowerCase());
            prescriptions = prescriptions.filter(p => p.type && types.includes(p.type.toLowerCase()));
        }

        // 4. Filter by Prescribed By (Specialization)
        if (specialization) {
            const specs = specialization.split(',').map(s => s.trim().toLowerCase());
            prescriptions = prescriptions.filter(p => p.specialization && specs.includes(p.specialization.toLowerCase()));
        }

        // --- SORTING ---
        if (sort === 'oldest') {
            // Expiration Date (Soonest Expiring First for Actual) or Date 
            prescriptions.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
        } else if (sort === 'a-z') {
            prescriptions.sort((a, b) => a.medication.localeCompare(b.medication));
        } else {
            // Default: Recent first (Date)
            prescriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        res.status(200).json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Request Prescription Refill
// @route   POST /api/medical-records/prescriptions/:id/refill
// @access  Private
const requestRefill = async (req, res) => {
    try {
        // ID format: bookingId_medicationId
        const [bookingId, medicationId] = req.params.id.split('_');

        const booking = await Booking.findById(bookingId);

        if (!booking || !booking.visitSummary || !booking.visitSummary.prescriptions) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        const prescription = booking.visitSummary.prescriptions.id(medicationId);

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Update status logic
        // In a real app, this would notify the doctor. Here we simulate a request.
        prescription.refillStatus = 'requested';

        await booking.save();

        // Create Notification
        await Notification.create({
            user: req.user.id,
            title: 'Refill Request Sent',
            message: `Your request for ${prescription.medication} has been submitted to your doctor.`,
            type: 'refill',
            refId: booking._id
        });

        res.status(200).json({ message: 'Refill Request Sent', refillStatus: 'requested' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Set Medication Reminder
// @route   PUT /api/medical-records/prescriptions/:id/reminder
// @access  Private
const setMedicationReminder = async (req, res) => {
    try {
        const [bookingId, medicationId] = req.params.id.split('_');
        const { frequency, times } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const prescription = booking.visitSummary.prescriptions.id(medicationId);
        if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

        prescription.reminderSettings = {
            active: true,
            frequency,
            times
        };

        await booking.save();
        res.status(200).json({ message: 'Reminder Activated', reminderSettings: prescription.reminderSettings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel Medication Reminder
// @route   DELETE /api/medical-records/prescriptions/:id/reminder
// @access  Private
const cancelMedicationReminder = async (req, res) => {
    try {
        const [bookingId, medicationId] = req.params.id.split('_');

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const prescription = booking.visitSummary.prescriptions.id(medicationId);
        if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

        prescription.reminderSettings.active = false;

        await booking.save();
        res.status(200).json({ message: 'Reminder Canceled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getLabReports,
    getPrescriptions,
    requestRefill,
    setMedicationReminder,
    cancelMedicationReminder
};
