const Doctor = require('../models/Doctor');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({});
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (doctor) {
            res.json(doctor);
        } else {
            res.status(404).json({ message: 'Doctor not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Seed sample doctors
// @route   POST /api/doctors/seed
// @access  Public (Dev only)
const seedDoctors = async (req, res) => {
    await Doctor.deleteMany({});

    const sampleDoctors = [
        {
            name: 'Dr. Charlotte Elizabeth Montgomery',
            specialization: 'Cardiologist',
            rating: 4.9,
            reviewsCount: 120,
            price: 80,
            image: 'https://img.freepik.com/free-photo/pleased-young-female-doctor-wearing-medical-robe-stethoscope-around-neck-standing-with-closed-posture_409827-254.jpg', // Placeholder image
            location: 'Mercy Heart Institute, 123 Main St, Boston',
            about: {
                generalInfo: 'Dr. Charlotte is an experienced cardiologist, she specializes in preventive cardiology, heart failure management, and advanced cardiac imaging.',
                currentWorkingPlace: 'Mercy Heart Institute, 123 Main St, Boston',
                education: 'Doctor of Medicine (MD), Johns Hopkins University.',
                certification: 'Board-certified in Cardiology by the American Board of Internal Medicine.',
                training: 'Completed residency and advanced cardiology fellowship at the Cleveland Clinic.',
                licensure: 'Fully licensed to practice medicine and cardiology in multiple states.',
                experience: 'Over 12 years of clinical practice, specializing in preventive care.'
            }
        },
        {
            name: 'Dr. Ayesha Khalid',
            specialization: 'Dermatologist',
            rating: 4.8,
            reviewsCount: 95,
            price: 60,
            image: 'https://img.freepik.com/free-photo/woman-doctor-wearing-lab-coat-with-stethoscope-isolated_1303-29791.jpg',
            location: 'Skin Care Clinic, New York',
            about: {
                generalInfo: 'Expert in clinical and cosmetic dermatology.',
                currentWorkingPlace: 'Skin Care Clinic, New York',
                education: 'MD from Harvard Medical School',
                certification: 'Board Certified Dermatologist',
                training: 'Residency at Mayo Clinic',
                licensure: 'Licensed in NY and CA',
                experience: '8 years of experience in treating skin conditions.'
            }
        }
    ];

    const createdDoctors = await Doctor.insertMany(sampleDoctors);
    res.json(createdDoctors);
};

module.exports = {
    getDoctors,
    getDoctorById,
    seedDoctors
};
