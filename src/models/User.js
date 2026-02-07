const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    dob: {
        type: Date
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    emergencyContact: {
        firstName: { type: String },
        lastName: { type: String },
        relationship: { type: String },
        phone: { type: String },
        email: { type: String },
        city: { type: String },
        address: { type: String }
    },
    healthProfile: {
        bloodType: { type: String, enum: ['O', 'A', 'B', 'AB'] },
        rhFactor: { type: String, enum: ['+', '-'] },
        allergies: { type: String },
        chronicConditions: { type: String },
        height: { type: Number },
        weight: { type: Number },
        bloodPressure: {
            systolic: { type: Number },
            diastolic: { type: Number }
        },
        oxygenSaturation: { type: Number }, // New field from design
        notes: { type: String } // General health notes from design
    },
    lifestyle: {
        smoking: { type: String, enum: ['Yes', 'No', 'Occasionally'] },
        alcohol: { type: String, enum: ['Yes', 'No', 'Occasionally'] },
        activityLevel: { type: String, enum: ['Light', 'Moderate', 'Very Active'] },
        sleep: { type: String }, // New field e.g. "7-8"
        waterIntake: { type: String } // New field e.g. "1-1.5"
    },
    email: {
        type: String,
        unique: true,
        sparse: true // Allows multiple users to have no email (null)
    },
    password: {
        type: String
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String // Profile photo URL
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    }],
    insurance: {
        provider: { type: String },
        policyNumber: { type: String },
        policyExpiryDate: { type: Date }, // New from design
        providerContact: { type: String } // New from design
    },
    notificationSettings: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false }
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    privacyPolicyAccepted: {
        type: Boolean,
        default: false
    },
    privacyPolicyAcceptedAt: {
        type: Date
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'lab', 'hospital', 'admin'],
        default: 'patient'
    },
    // Doctor-specific fields (only populated if role === 'doctor')
    doctorProfile: {
        specialization: { type: String },
        qualifications: [{ type: String }],
        experience: { type: Number }, // years
        consultationFee: { type: Number },
        licenseNumber: { type: String },
        hospitalAffiliations: [{
            hospitalId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Hospital'
            },
            department: { type: String }
        }],
        availability: [{
            day: {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            },
            slots: [{
                startTime: { type: String },
                endTime: { type: String }
            }]
        }],
        rating: { type: Number, default: 0 },
        reviewsCount: { type: Number, default: 0 },
        verificationStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    },
    // Lab/Hospital reference (if role === 'lab' or 'hospital')
    entityReference: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'entityModel'
    },
    entityModel: {
        type: String,
        enum: ['Lab', 'Hospital']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
