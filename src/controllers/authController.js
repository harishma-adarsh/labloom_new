const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: 'Request body is missing' });
    }
    const { name, email, password, phone, privacyPolicyAccepted } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ message: 'Please add name and phone number' });
    }

    // Check if user exists (by phone or email if provided)
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
        privacyPolicyAccepted: Boolean(privacyPolicyAccepted),
        privacyPolicyAcceptedAt: privacyPolicyAccepted ? Date.now() : undefined
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user.id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: 'Request body is missing' });
    }
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user.id),
        });
    } else {
        res.status(400).json({ message: 'Invalid credentials' });
    }
};

// @desc    Send OTP to mobile number
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
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

    // In a real app, send SMS here. For dev, log to console.
    console.log(`### OTP for ${phone}: ${otp} ###`);

    res.status(200).json({ message: 'OTP sent successfully' });
};

// @desc    Login with OTP
// @route   POST /api/auth/login-otp
// @access  Public
const loginWithOtp = async (req, res) => {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });

    if (user && user.otp === otp && user.otpExpires > Date.now()) {
        // Clear OTP after successful login
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user.id),
        });
    } else {
        res.status(400).json({ message: 'Invalid or expired OTP' });
    }
};

const getMe = async (req, res) => {
    res.status(200).json(req.user)
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;
        user.dob = req.body.dob || user.dob;
        user.address = req.body.address || user.address;
        user.city = req.body.city || user.city;

        // Update Emergency Contact if provided
        if (req.body.emergencyContact) {
            user.emergencyContact = {
                firstName: req.body.emergencyContact.firstName || user.emergencyContact?.firstName,
                lastName: req.body.emergencyContact.lastName || user.emergencyContact?.lastName,
                relationship: req.body.emergencyContact.relationship || user.emergencyContact?.relationship,
                phone: req.body.emergencyContact.phone || user.emergencyContact?.phone,
                email: req.body.emergencyContact.email || user.emergencyContact?.email,
                city: req.body.emergencyContact.city || user.emergencyContact?.city,
                address: req.body.emergencyContact.address || user.emergencyContact?.address
            };
        }

        // Update Health Profile if provided
        if (req.body.healthProfile) {
            user.healthProfile = {
                bloodType: req.body.healthProfile.bloodType || user.healthProfile?.bloodType,
                rhFactor: req.body.healthProfile.rhFactor || user.healthProfile?.rhFactor,
                allergies: req.body.healthProfile.allergies || user.healthProfile?.allergies,
                chronicConditions: req.body.healthProfile.chronicConditions || user.healthProfile?.chronicConditions,
                height: req.body.healthProfile.height || user.healthProfile?.height,
                weight: req.body.healthProfile.weight || user.healthProfile?.weight,
                oxygenSaturation: req.body.healthProfile.oxygenSaturation || user.healthProfile?.oxygenSaturation,
                notes: req.body.healthProfile.notes || user.healthProfile?.notes,
                bloodPressure: {
                    systolic: req.body.healthProfile.bloodPressure?.systolic || user.healthProfile?.bloodPressure?.systolic,
                    diastolic: req.body.healthProfile.bloodPressure?.diastolic || user.healthProfile?.bloodPressure?.diastolic
                }
            };
        }

        // Update Lifestyle if provided
        if (req.body.lifestyle) {
            user.lifestyle = {
                smoking: req.body.lifestyle.smoking || user.lifestyle?.smoking,
                alcohol: req.body.lifestyle.alcohol || user.lifestyle?.alcohol,
                activityLevel: req.body.lifestyle.activityLevel || user.lifestyle?.activityLevel,
                sleep: req.body.lifestyle.sleep || user.lifestyle?.sleep,
                waterIntake: req.body.lifestyle.waterIntake || user.lifestyle?.waterIntake
            };
        }

        if (req.body.insurance) {
            user.insurance = {
                provider: req.body.insurance.provider || user.insurance?.provider,
                policyNumber: req.body.insurance.policyNumber || user.insurance?.policyNumber,
                policyExpiryDate: req.body.insurance.policyExpiryDate || user.insurance?.policyExpiryDate,
                providerContact: req.body.insurance.providerContact || user.insurance?.providerContact
            };
        }

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            phone: updatedUser.phone,
            dob: updatedUser.dob,
            address: updatedUser.address,
            city: updatedUser.city,
            emergencyContact: updatedUser.emergencyContact,
            healthProfile: updatedUser.healthProfile,
            lifestyle: updatedUser.lifestyle,
            insurance: updatedUser.insurance,
            role: updatedUser.role,
            token: generateToken(updatedUser.id),
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

const verifyOtp = loginWithOtp;
const getProfile = getMe;

module.exports = {
    registerUser,
    loginUser,
    getMe,
    sendOtp,
    loginWithOtp,
    verifyOtp,
    getProfile,
    updateProfile,
};
