const mongoose = require('mongoose');

const refreshTokenSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // Auto-delete after 30 days
    }
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
