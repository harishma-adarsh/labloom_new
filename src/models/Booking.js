const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
    },
    lab: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lab'
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    amount: {
        type: Number // Total amount paid by patient
    },
    platformFee: {
        type: Number, // ₹50 platform fee for lab bookings
        default: 0
    },
    revenue: {
        labAmount: { type: Number }, // Base price going to Lab
        hospitalAmount: { type: Number }, // Consultation fee going to Hospital
        adminAmount: { type: Number } // Platform fee going to Admin
    },
    bookingType: {
        type: String,
        enum: ['test', 'doctor'],
        required: true,
        default: 'test'
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String // e.g., "10:00", "14:30"
    },
    appointmentMode: {
        type: String,
        enum: ['In-person', 'Video call']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'test_not_done'],
        default: 'pending'
    },
    visitSummary: {
        anamnesis: { type: String }, // History
        symptoms: [{ type: String }], // e.g. ["Shortness of breath", "Blue-tinged lips"]
        diagnosis: { type: String }, // e.g. "Atrial Fibrillation"
        examinations: [{
            testName: { type: String },
            date: { type: Date },
            status: { type: String }, // e.g. "Normal Results", "Follow-Up Needed"
            resultUrl: { type: String } // Link to download PDF
        }],
        prescriptions: [{
            medication: { type: String }, // e.g. "Amoxicillin 250mg"
            type: { type: String }, // e.g. "Capsules", "Tablets", "Syrups"
            description: { type: String }, // e.g. "Antibiotic for bacterial infections"
            dosage: { type: String }, // e.g. "1 capsule (250mg)"
            frequency: { type: String }, // e.g. "Once, Every day"
            duration: { type: String }, // e.g. "14 May - 30 May, 2024" (Display string)
            endDate: { type: Date }, // For "Actual" vs "History" logic
            specialInstructions: { type: String }, // e.g. "Take with food..."
            storage: { type: String }, // e.g. "Store at room temperature..."
            sideEffects: { type: String }, // e.g. "Possible nausea..."
            allergyWarning: { type: String }, // e.g. "Avoid if allergic to penicillin"
            refillStatus: {
                type: String,
                enum: ['none', 'requested', 'approved', 'denied'],
                default: 'none'
            },
            reminderSettings: {
                active: { type: Boolean, default: false },
                frequency: { type: String }, // e.g. "3 times a day"
                times: [{ type: String }] // e.g. ["08:00", "16:00", "20:00"]
            }
        }]
    },
    notes: {
        type: String
    },
    labReport: {
        reportUrl: { type: String },
        status: { type: String, default: 'Pending' }, // e.g. "Normal Results", "Requires Attention"
        resultDate: { type: Date }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
