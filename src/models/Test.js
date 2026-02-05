const mongoose = require('mongoose');

const testSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String, // e.g. "Hormonal Tests", "Lipid Panel"
        default: 'General'
    },
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: String, // e.g., '15 mins', '1 hour'
        required: true
    },
    image: {
        type: String // URL to test image
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Test', testSchema);
