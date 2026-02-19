const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Get popular hospitals
// @route   GET /api/hospitals/popular
// @access  Public
const getPopularHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find({ verificationStatus: 'approved' })
            .sort({ rating: -1, reviewsCount: -1 })
            .limit(10)
            .select('name address rating reviewsCount image departments type facilities emergencyServices');

        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get doctors at a specific hospital
// @route   GET /api/hospitals/:id/doctors
// @access  Public
const getHospitalDoctorsPublic = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id)
            .populate('associatedDoctors.doctorId', 'name email phone doctorProfile.specialization doctorProfile.consultationFee doctorProfile.rating image');

        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        const doctors = hospital.associatedDoctors
            .filter(d => d.isActive)
            .map(d => ({
                _id: d.doctorId?._id,
                name: d.doctorId?.name,
                specialization: d.doctorId?.doctorProfile?.specialization,
                consultationFee: d.doctorId?.doctorProfile?.consultationFee,
                rating: d.doctorId?.doctorProfile?.rating,
                image: d.doctorId?.image,
                department: d.department,
                joinedAt: d.joinedAt
            }));

        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add doctor to hospital (assign)
// @route   POST /api/hospital/doctors/assign
// @access  Private (Hospital admin)
const assignDoctorToHospital = async (req, res) => {
    try {
        const { doctorId, department } = req.body;
        const hospitalId = req.user.entityReference;

        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

        // Check if doctor exists
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== 'doctor') {
            return res.status(400).json({ message: 'Valid doctor ID required' });
        }

        // Check if already assigned
        const alreadyAssigned = hospital.associatedDoctors.find(
            d => d.doctorId.toString() === doctorId
        );
        if (alreadyAssigned) {
            return res.status(400).json({ message: 'Doctor already assigned to this hospital' });
        }

        // Add to hospital
        hospital.associatedDoctors.push({
            doctorId,
            department,
            isActive: true
        });

        // Also update doctor's profile
        if (!doctor.doctorProfile) doctor.doctorProfile = {};
        if (!doctor.doctorProfile.hospitalAffiliations) doctor.doctorProfile.hospitalAffiliations = [];
        doctor.doctorProfile.hospitalAffiliations.push({
            hospitalId,
            department
        });

        await hospital.save();
        await doctor.save();

        res.status(201).json({ message: 'Doctor assigned to hospital successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add doctor to hospital (legacy)
// @route   POST /api/hospital/add-doctor
// @access  Private (Hospital admin)
const addDoctorToHospital = async (req, res) => {
    return assignDoctorToHospital(req, res);
};

// @desc    Manage time slots for a doctor
// @route   POST /api/hospital/slots/manage
// @access  Private (Hospital admin)
const manageSlots = async (req, res) => {
    try {
        const { doctorId, day, slots } = req.body;
        // slots = [{ startTime: "09:00", endTime: "09:30" }, ...]
        // day = "Monday", "Tuesday", etc.

        if (!doctorId || !day || !slots) {
            return res.status(400).json({ message: 'doctorId, day, and slots are required' });
        }

        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== 'doctor') {
            return res.status(400).json({ message: 'Valid doctor ID required' });
        }

        if (!doctor.doctorProfile) doctor.doctorProfile = {};
        if (!doctor.doctorProfile.availability) doctor.doctorProfile.availability = [];

        // Find existing day entry or create new
        const existingDayIndex = doctor.doctorProfile.availability.findIndex(a => a.day === day);

        if (existingDayIndex >= 0) {
            doctor.doctorProfile.availability[existingDayIndex].slots = slots;
        } else {
            doctor.doctorProfile.availability.push({ day, slots });
        }

        await doctor.save();

        res.json({ message: `Slots updated for ${day}`, availability: doctor.doctorProfile.availability });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Complete appointment
// @route   PATCH /api/hospital/appointments/:id/complete
// @access  Private (Hospital admin)
const completeAppointment = async (req, res) => {
    try {
        const appointment = await Booking.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Verify this appointment belongs to a doctor in this hospital
        const hospitalId = req.user.entityReference;
        const hospital = await Hospital.findById(hospitalId);

        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        const doctorIds = hospital.associatedDoctors.map(d => d.doctorId.toString());
        if (!doctorIds.includes(appointment.doctor.toString())) {
            return res.status(403).json({ message: 'Appointment does not belong to this hospital' });
        }

        appointment.status = 'completed';
        await appointment.save();

        res.json({ message: 'Appointment marked as completed', appointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get hospital doctors (internal)
// @route   GET /api/hospital/doctors
// @access  Private (Hospital admin)
const getHospitalDoctors = async (req, res) => {
    try {
        const hospitalId = req.user.entityReference;
        const hospital = await Hospital.findById(hospitalId).populate('associatedDoctors.doctorId', 'name email phone doctorProfile.specialization');

        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

        res.json(hospital.associatedDoctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove doctor from hospital
// @route   DELETE /api/hospital/doctors/:id
// @access  Private (Hospital admin)
const removeDoctorFromHospital = async (req, res) => {
    try {
        const doctorId = req.params.id;
        const hospitalId = req.user.entityReference;

        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

        hospital.associatedDoctors = hospital.associatedDoctors.filter(d => d.doctorId.toString() !== doctorId);
        await hospital.save();

        // Update doctor profile (remove affiliation)
        const doctor = await User.findById(doctorId);
        if (doctor && doctor.doctorProfile && doctor.doctorProfile.hospitalAffiliations) {
            doctor.doctorProfile.hospitalAffiliations = doctor.doctorProfile.hospitalAffiliations.filter(h => h.hospitalId.toString() !== hospitalId);
            await doctor.save();
        }

        res.json({ message: 'Doctor removed from hospital staff' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get hospital finance/revenue report
// @route   GET /api/hospital/finance
// @access  Private (Hospital admin)
const getHospitalFinance = async (req, res) => {
    try {
        const hospitalId = req.user.entityReference;
        const { startDate, endDate } = req.query;

        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

        const doctorIds = hospital.associatedDoctors.map(d => d.doctorId);

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        // Get completed doctor appointments for this hospital
        const completedAppointments = await Booking.find({
            doctor: { $in: doctorIds },
            bookingType: 'doctor',
            status: 'completed',
            ...dateFilter
        }).populate('doctor', 'name specialization');

        // Calculate revenue
        const totalRevenue = completedAppointments.reduce((sum, appt) => {
            return sum + (appt.revenue?.hospitalAmount || appt.amount || 0);
        }, 0);

        const revenueByDoctor = {};
        completedAppointments.forEach(appt => {
            const doctorName = appt.doctor?.name || 'Unknown';
            if (!revenueByDoctor[doctorName]) {
                revenueByDoctor[doctorName] = { appointments: 0, revenue: 0 };
            }
            revenueByDoctor[doctorName].appointments++;
            revenueByDoctor[doctorName].revenue += (appt.revenue?.hospitalAmount || appt.amount || 0);
        });

        res.json({
            totalAppointments: completedAppointments.length,
            totalRevenue,
            revenueByDoctor,
            currency: 'INR'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get hospital dashboard stats
// @route   GET /api/hospital/dashboard
// @access  Private (Hospital admin)
const getHospitalDashboard = async (req, res) => {
    try {
        const hospitalId = req.user.entityReference;

        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

        const doctorCount = hospital.associatedDoctors.length;
        const doctorIds = hospital.associatedDoctors.map(d => d.doctorId);

        const appointmentCount = await Booking.countDocuments({
            doctor: { $in: doctorIds },
            bookingType: 'doctor'
        });

        const completedAppointments = await Booking.countDocuments({
            doctor: { $in: doctorIds },
            bookingType: 'doctor',
            status: 'completed'
        });

        // Calculate real revenue from completed appointments
        const completedBookings = await Booking.find({
            doctor: { $in: doctorIds },
            bookingType: 'doctor',
            status: 'completed'
        });

        const totalRevenue = completedBookings.reduce((sum, b) => {
            return sum + (b.revenue?.hospitalAmount || b.amount || 0);
        }, 0);

        res.json({
            activeDoctors: doctorCount,
            totalAppointments: appointmentCount,
            completedVisits: completedAppointments,
            revenue: totalRevenue,
            currency: 'INR'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all hospital appointments
// @route   GET /api/hospital/appointments
// @access  Private (Hospital admin)
const getHospitalAppointments = async (req, res) => {
    try {
        const hospitalId = req.user.entityReference;
        const hospital = await Hospital.findById(hospitalId);
        const doctorIds = hospital.associatedDoctors.map(d => d.doctorId);

        const appointments = await Booking.find({
            doctor: { $in: doctorIds },
            bookingType: 'doctor'
        })
            .populate('user', 'name phone')
            .populate('doctor', 'name specialization')
            .sort({ date: -1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPopularHospitals,
    getHospitalDoctorsPublic,
    assignDoctorToHospital,
    addDoctorToHospital,
    manageSlots,
    completeAppointment,
    getHospitalDoctors,
    removeDoctorFromHospital,
    getHospitalFinance,
    getHospitalDashboard,
    getHospitalAppointments
};
