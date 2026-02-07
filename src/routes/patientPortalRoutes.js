const express = require('express');
const router = express.Router();
const { getPatientDashboard, getLabs } = require('../controllers/patientPortalController');
const { getMe, updateProfile } = require('../controllers/authV2Controller');
const { getMetricHistory, addMetric } = require('../controllers/metricController');
const { getMyBookings, createBooking } = require('../controllers/bookingController');
const { getDoctors } = require('../controllers/doctorController');
const { getLabReports, getPrescriptions } = require('../controllers/medicalRecordController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Patient Portal
 *   description: Endpoints for patients to manage health, appointments, and records
 */

/**
 * @swagger
 * /api/patients/dashboard:
 *   get:
 *     summary: Get patient dashboard summary
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard data }
 */
router.get('/dashboard', protect, getPatientDashboard);

/**
 * @swagger
 * /api/patients/me:
 *   get:
 *     summary: Fetch patient profile and preferences
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Patient profile }
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/patients/me:
 *   patch:
 *     summary: Update personal information
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Profile updated }
 */
router.patch('/me', protect, updateProfile);

/**
 * @swagger
 * /api/patients/health-metrics:
 *   get:
 *     summary: Fetch historical health data
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *     responses:
 *       200: { description: Health metrics }
 */
router.get('/health-metrics', protect, (req, res, next) => {
    // Adapter for existing metric controller which expects params
    req.params.type = req.query.type || 'all';
    getMetricHistory(req, res, next);
});

/**
 * @swagger
 * /api/patients/health-metrics:
 *   post:
 *     summary: Log new health readings manually
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201: { description: Metric logged }
 */
router.post('/health-metrics', protect, addMetric);

/**
 * @swagger
 * /api/patients/appointments/me:
 *   get:
 *     summary: List patient's consultation history and upcoming visits
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of appointments }
 */
router.get('/appointments/me', protect, getMyBookings);

/**
 * @swagger
 * /api/patients/appointments:
 *   post:
 *     summary: Book a new consultation with a doctor
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201: { description: Appointment booked }
 */
router.post('/appointments', protect, createBooking);

/**
 * @swagger
 * /api/patients/bookings/me:
 *   get:
 *     summary: History of lab tests and current statuses
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of bookings }
 */
router.get('/bookings/me', protect, getMyBookings);

/**
 * @swagger
 * /api/patients/bookings:
 *   post:
 *     summary: Book a specific diagnostic test
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201: { description: Test booked }
 */
router.post('/bookings', protect, createBooking);

/**
 * @swagger
 * /api/patients/doctors:
 *   get:
 *     summary: Search/filter available doctors
 *     tags: [Patient Portal]
 *     responses:
 *       200: { description: List of doctors }
 */
router.get('/doctors', getDoctors);

/**
 * @swagger
 * /api/patients/labs:
 *   get:
 *     summary: Find available labs
 *     tags: [Patient Portal]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of labs }
 */
router.get('/labs', getLabs);

/**
 * @swagger
 * /api/patients/reports:
 *   get:
 *     summary: Access and download finalized lab reports
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lab reports }
 */
router.get('/reports', protect, getLabReports);

/**
 * @swagger
 * /api/patients/prescriptions:
 *   get:
 *     summary: View digital prescriptions
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Prescriptions }
 */
router.get('/prescriptions', protect, getPrescriptions);

module.exports = router;
