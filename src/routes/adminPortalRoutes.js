const express = require('express');
const router = express.Router();
const {
    adminRequestOtp,
    adminVerifyOtp,
    getPendingHospitals,
    approveHospital,
    getPendingLabs,
    approveLab,
    getPendingDoctors,
    approveDoctor,
    getAllUsers,
    updateUserStatus,
    getSystemAnalytics
} = require('../controllers/adminPortalController');
const { protect, admin } = require('../middleware/authMiddleware');

// PUBLIC ROUTES (No Auth Middleware)
router.post('/request-otp', adminRequestOtp);
router.post('/verify-otp', adminVerifyOtp);

// PROTECTED ROUTES (Middleware applied per route)
router.get('/pending-hospitals', protect, admin, getPendingHospitals);
router.post('/approve-hospital/:id', protect, admin, approveHospital);
router.get('/pending-labs', protect, admin, getPendingLabs);
router.post('/approve-lab/:id', protect, admin, approveLab);
router.get('/pending-doctors', protect, admin, getPendingDoctors);
router.post('/approve-doctor/:id', protect, admin, approveDoctor);
router.get('/users', protect, admin, getAllUsers);
router.patch('/users/:id/status', protect, admin, updateUserStatus);
router.get('/reports/system', protect, admin, getSystemAnalytics);

module.exports = router;
