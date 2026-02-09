const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate Access Token (short-lived)
const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '15m', // 15 minutes
    });
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

// @desc    Register new user with role
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
    const { name, email, password, phone, role, privacyPolicyAccepted } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ message: 'Please add name and phone number' });
    }

    // Validate role
    const validRoles = ['patient', 'doctor', 'lab', 'hospital'];
    const userRole = validRoles.includes(role) ? role : 'patient';

    // Check if user exists
    const userExists = await User.findOne({
        $or: [
            { phone },
            ...(email ? [{ email }] : [])
        ]
    });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password if provided
    let hashedPassword;
    if (password) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        role: userRole,
        privacyPolicyAccepted: Boolean(privacyPolicyAccepted),
        privacyPolicyAcceptedAt: privacyPolicyAccepted ? Date.now() : undefined
    });

    if (user) {
        // Generate tokens
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken();

        // Save refresh token
        await RefreshToken.create({
            user: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            accessToken,
            refreshToken
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Request OTP for mobile login
// @route   POST /api/auth/request-otp
// @access  Public
const requestOtp = async (req, res) => {
    const { phone } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
        return res.status(404).json({ message: 'User not found with this mobile number' });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Set OTP and expiration (10 minutes)
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // In production, send SMS here
    console.log(`### OTP for ${phone}: ${otp} ###`);

    res.status(200).json({ message: 'OTP sent successfully' });
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });

    if (user && user.otp === otp && user.otpExpires > Date.now()) {
        // Clear OTP after successful login
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Generate tokens
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken();

        // Save refresh token
        await RefreshToken.create({
            user: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            accessToken,
            refreshToken
        });
    } else {
        res.status(400).json({ message: 'Invalid or expired OTP' });
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
    }

    // Find refresh token in database
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken }).populate('user');

    if (!tokenDoc) {
        return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Check if token is expired
    if (tokenDoc.expiresAt < Date.now()) {
        await RefreshToken.deleteOne({ _id: tokenDoc._id });
        return res.status(401).json({ message: 'Refresh token expired' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(tokenDoc.user.id, tokenDoc.user.role);

    res.json({
        accessToken,
        user: {
            _id: tokenDoc.user.id,
            name: tokenDoc.user.name,
            role: tokenDoc.user.role
        }
    });
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        await RefreshToken.deleteOne({ token: refreshToken });
    }

    res.json({ message: 'Logged out successfully' });
};

// @desc    Get current user profile
// @route   GET /api/patients/me (and other portals)
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpires');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user profile
// @route   PATCH /api/patients/me (and other portals)
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update allowed fields
        const allowedUpdates = ['name', 'email', 'phone', 'address', 'dateOfBirth', 'gender'];
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });

        // If password is being updated
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            address: updatedUser.address,
            dateOfBirth: updatedUser.dateOfBirth,
            gender: updatedUser.gender
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    signup,
    requestOtp,
    verifyOtp,
    refreshAccessToken,
    logout,
    getMe,
    updateProfile
};
