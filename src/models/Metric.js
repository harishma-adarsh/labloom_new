const mongoose = require('mongoose');

const metricSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    type: {
        type: String,
        required: true,
        enum: ['Blood Pressure', 'Weight', 'Heart Rate', 'Blood Sugar', 'Temperature']
    },
    value: {
        type: Number, // Primary value (e.g., Weight in kg, Heart Rate in bpm)
        required: true
    },
    value2: {
        type: Number // Secondary value (e.g., Diastolic for BP)
    },
    unit: {
        type: String,
        required: true // e.g., "kg", "bpm", "mmHg"
    },
    date: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Metric', metricSchema);
