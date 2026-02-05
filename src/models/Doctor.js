const mongoose = require('mongoose');

const doctorSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    specialization: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    reviewsCount: {
        type: Number,
        default: 0
    },
    price: {
        type: Number, // Price per consultation
        required: true
    },
    image: {
        type: String // URL to doctor's image
    },
    about: {
        generalInfo: { type: String },
        currentWorkingPlace: { type: String },
        education: { type: String },
        certification: { type: String },
        training: { type: String },
        licensure: { type: String },
        experience: { type: String } // e.g. "Over 12 years..."
    },
    location: {
        type: String // e.g. "Mercy Heart Institute..."
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);
