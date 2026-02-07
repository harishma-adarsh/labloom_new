const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Add doctor to hospital
// @route   POST /api/hospital/doctors
// @access  Private (Hospital admin)
const addDoctorToHospital = async (req, res) => {
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

        // Add to hospital
        hospital.associatedDoctors.push({
            doctorId,
            department,
            isActive: true
        });

        // Also update doctor's profile
        if (!doctor.doctorProfile) doctor.doctorProfile = {};
        doctor.doctorProfile.hospitalAffiliations.push({
            hospitalId,
            department
        });

        await hospital.save();
        await doctor.save();

        res.status(201).json({ message: 'Doctor associated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get hospital doctors
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
        if (doctor && doctor.doctorProfile) {
            doctor.doctorProfile.hospitalAffiliations = doctor.doctorProfile.hospitalAffiliations.filter(h => h.hospitalId.toString() !== hospitalId);
            await doctor.save();
        }

        res.json({ message: 'Doctor removed from hospital staff' });
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

        const doctorCount = await Hospital.findOne({ _id: hospitalId }).then(h => h.associatedDoctors.length);

        // Count appointments for this hospital's doctors
        const hospital = await Hospital.findById(hospitalId);
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

        res.json({
            activeDoctors: doctorCount,
            totalAppointments: appointmentCount,
            completedVisits: completedAppointments,
            revenue: completedAppointments * 500 // Dummy revenue calc
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
    addDoctorToHospital,
    getHospitalDoctors,
    removeDoctorFromHospital,
    getHospitalDashboard,
    getHospitalAppointments
};
