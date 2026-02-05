const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['refill', 'appointment', 'report', 'general'],
        default: 'general'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    refId: {
        type: mongoose.Schema.Types.ObjectId // Reference to Booking, Test, etc.
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
