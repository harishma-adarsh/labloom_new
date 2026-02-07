const Booking = require('../models/Booking');
const Consultation = require('../models/Consultation');
const User = require('../models/User');

// @desc    Get doctor's appointments
// @route   GET /api/doctor/appointments
// @access  Private (Doctor only)
const getDoctorAppointments = async (req, res) => {
    try {
        const { status, date, page = 1, limit = 20 } = req.query;

        let filter = {
            doctor: req.user.id,
            bookingType: 'doctor'
        };

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

        const appointments = await Booking.find(filter)
            .populate('user', 'name phone email image')
            .sort({ date: 1, time: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Booking.countDocuments(filter);

        res.json({
            appointments,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private (Doctor only)
const updateAppointmentStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;

        const appointment = await Booking.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Verify doctor owns this appointment
        if (appointment.doctor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this appointment' });
        }

        appointment.status = status;
        if (reason) {
            appointment.notes = reason;
        }

        await appointment.save();

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get appointment details
// @route   GET /api/appointments/:id
// @access  Private (Doctor/Patient)
const getAppointmentDetails = async (req, res) => {
    try {
        const appointment = await Booking.findById(req.params.id)
            .populate('user', 'name phone email dob healthProfile emergencyContact')
            .populate('doctor', 'name doctorProfile.specialization');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check authorization
        const isDoctor = req.user.role === 'doctor' && appointment.doctor._id.toString() === req.user.id;
        const isPatient = req.user.role === 'patient' && appointment.user._id.toString() === req.user.id;

        if (!isDoctor && !isPatient) {
            return res.status(403).json({ message: 'Not authorized to view this appointment' });
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get doctor's patient list
// @route   GET /api/doctor/patients
// @access  Private (Doctor only)
const getDoctorPatients = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;

        // Find all unique patients who have had appointments with this doctor
        const appointments = await Booking.find({
            doctor: req.user.id,
            bookingType: 'doctor'
        }).distinct('user');

        let filter = { _id: { $in: appointments } };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const patients = await User.find(filter)
            .select('name phone email image dob')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await User.countDocuments(filter);

        res.json({
            patients,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get patient medical history
// @route   GET /api/patients/:id/history
// @access  Private (Doctor only - with authorization)
const getPatientHistory = async (req, res) => {
    try {
        const patientId = req.params.id;

        // Verify doctor has treated this patient
        const hasAppointment = await Booking.findOne({
            doctor: req.user.id,
            user: patientId
        });

        if (!hasAppointment) {
            return res.status(403).json({ message: 'Not authorized to view this patient\'s history' });
        }

        // Get patient details
        const patient = await User.findById(patientId)
            .select('name phone email dob healthProfile lifestyle emergencyContact');

        // Get past consultations
        const consultations = await Consultation.find({
            patient: patientId,
            status: 'completed'
        })
            .populate('doctor', 'name doctorProfile.specialization')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get past appointments
        const appointments = await Booking.find({
            user: patientId,
            bookingType: 'doctor',
            status: 'completed'
        })
            .populate('doctor', 'name doctorProfile.specialization')
            .sort({ date: -1 })
            .limit(10);

        res.json({
            patient,
            consultations,
            appointments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Save consultation records
// @route   POST /api/consultations/:appointmentId/records
// @access  Private (Doctor only)
const saveConsultationRecords = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const consultationData = req.body;

        // Verify appointment exists and belongs to doctor
        const appointment = await Booking.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.doctor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Create or update consultation
        let consultation = await Consultation.findOne({ appointment: appointmentId });

        if (consultation) {
            // Update existing
            Object.assign(consultation, consultationData);
            consultation.updatedAt = Date.now();
        } else {
            // Create new
            consultation = await Consultation.create({
                appointment: appointmentId,
                doctor: req.user.id,
                patient: appointment.user,
                ...consultationData
            });
        }

        await consultation.save();

        res.json(consultation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Issue prescription
// @route   POST /api/consultations/:appointmentId/prescribe
// @access  Private (Doctor only)
const issuePrescription = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { prescriptions } = req.body;

        // Verify appointment
        const appointment = await Booking.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.doctor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Find or create consultation
        let consultation = await Consultation.findOne({ appointment: appointmentId });

        if (!consultation) {
            consultation = await Consultation.create({
                appointment: appointmentId,
                doctor: req.user.id,
                patient: appointment.user,
                prescriptions
            });
        } else {
            consultation.prescriptions = prescriptions;
            await consultation.save();
        }

        // Also update booking's visitSummary for backward compatibility
        if (!appointment.visitSummary) {
            appointment.visitSummary = {};
        }
        appointment.visitSummary.prescriptions = prescriptions;
        await appointment.save();

        res.json({
            message: 'Prescription issued successfully',
            consultation
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDoctorAppointments,
    updateAppointmentStatus,
    getAppointmentDetails,
    getDoctorPatients,
    getPatientHistory,
    saveConsultationRecords,
    issuePrescription
};
