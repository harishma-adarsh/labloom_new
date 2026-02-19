const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            return next();
        } catch (error) {
            console.log(error);
            return res.status(401).json({ message: 'Not authorized' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

// Generic role authorization middleware
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required roles: ${roles.join(', ')}`
            });
        }

        next();
    };
};

// Specific role middleware
const verifyDoctor = (req, res, next) => {
    if (req.user && req.user.role === 'doctor') {
        if (req.user.doctorProfile && req.user.doctorProfile.verificationStatus === 'approved') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Doctor account pending approval.' });
        }
    } else {
        res.status(403).json({ message: 'Access denied. Doctor only.' });
    }
};

const verifyLab = (req, res, next) => {
    if (req.user && req.user.role === 'lab') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Lab only.' });
    }
};

const verifyHospital = (req, res, next) => {
    if (req.user && req.user.role === 'hospital') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Hospital only.' });
    }
};

module.exports = { protect, admin, authorizeRoles, verifyDoctor, verifyLab, verifyHospital };
