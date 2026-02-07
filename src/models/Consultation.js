const mongoose = require('mongoose');

const consultationSchema = mongoose.Schema({
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Booking'
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    chiefComplaint: {
        type: String
    },
    diagnosis: {
        type: String
    },
    clinicalNotes: {
        type: String
    },
    vitalSigns: {
        temperature: { type: Number },
        bloodPressure: {
            systolic: { type: Number },
            diastolic: { type: Number }
        },
        heartRate: { type: Number },
        respiratoryRate: { type: Number },
        oxygenSaturation: { type: Number }
    },
    prescriptions: [{
        medication: { type: String, required: true },
        dosage: { type: String },
        frequency: { type: String },
        duration: { type: String },
        instructions: { type: String }
    }],
    labTestsOrdered: [{
        testName: { type: String },
        urgency: { type: String, enum: ['Routine', 'Urgent', 'STAT'] }
    }],
    followUp: {
        required: { type: Boolean, default: false },
        date: { type: Date },
        notes: { type: String }
    },
    status: {
        type: String,
        enum: ['draft', 'completed', 'reviewed'],
        default: 'draft'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

consultationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Consultation', consultationSchema);
