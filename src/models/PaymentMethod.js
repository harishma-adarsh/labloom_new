const mongoose = require('mongoose');

const paymentMethodSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    brand: {
        type: String, // e.g., "Visa", "Mastercard"
        required: true
    },
    last4: {
        type: String,
        required: true
    },
    expMonth: {
        type: Number,
        required: true
    },
    expYear: {
        type: Number,
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
