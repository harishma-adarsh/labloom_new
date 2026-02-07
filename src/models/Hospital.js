const mongoose = require('mongoose');

const hospitalSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    registrationNumber: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String, default: 'India' }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        }
    },
    type: {
        type: String,
        enum: ['general', 'specialty', 'multi-specialty', 'clinic'],
        default: 'general'
    },
    departments: [{
        name: { type: String },
        headOfDepartment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    associatedDoctors: [{
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        department: { type: String },
        joinedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
    }],
    facilities: [{
        name: { type: String },
        description: { type: String }
    }],
    bedCapacity: {
        total: { type: Number },
        available: { type: Number }
    },
    emergencyServices: {
        type: Boolean,
        default: false
    },
    ambulanceService: {
        type: Boolean,
        default: false
    },
    accreditations: [{
        name: { type: String },
        issuedBy: { type: String },
        validUntil: { type: Date }
    }],
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    rating: {
        type: Number,
        default: 0
    },
    reviewsCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Hospital', hospitalSchema);
