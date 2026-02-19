const express = require('express');
const router = express.Router();
const {
    getPatientDashboard,
    getLabs,
    getLabTests,
    getPopularHospitals,
    getDoctorSlots,
    submitFeedback,
    getReviews,
    uploadProfileImage
} = require('../controllers/patientPortalController');
const { getMe, updateProfile } = require('../controllers/authV2Controller');
const { getMetricHistory, addMetric } = require('../controllers/metricController');
const { getMyBookings, createBooking } = require('../controllers/bookingController');
const { getDoctors } = require('../controllers/doctorController');
const { getLabReports, getPrescriptions } = require('../controllers/medicalRecordController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

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

/**
 * @swagger
 * /api/patients/labs/{id}/tests:
 *   get:
 *     summary: View tests provided by a specific lab
 *     tags: [Patient Portal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of tests }
 */
router.get('/labs/:id/tests', getLabTests);

/**
 * @swagger
 * /api/patients/hospitals/popular:
 *   get:
 *     summary: List popular hospitals
 *     tags: [Patient Portal]
 *     responses:
 *       200: { description: List of popular hospitals }
 */
router.get('/hospitals/popular', getPopularHospitals);

/**
 * @swagger
 * /api/patients/doctors/{id}/slots:
 *   get:
 *     summary: View specific slots assigned by the hospital for a doctor
 *     tags: [Patient Portal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: List of slots }
 */
router.get('/doctors/:id/slots', getDoctorSlots);

/**
 * @swagger
 * /api/patients/feedback:
 *   post:
 *     summary: Submit feedback/review for labs, doctors, or hospitals
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetId: { type: string }
 *               targetType: { type: string, enum: [doctor, lab, hospital] }
 *               rating: { type: number }
 *               comment: { type: string }
 *     responses:
 *       201: { description: Feedback submitted }
 */
router.post('/feedback', protect, submitFeedback);

/**
 * @swagger
 * /api/patients/reviews:
 *   get:
 *     summary: Get reviews for a specific entity
 *     tags: [Patient Portal]
 *     parameters:
 *       - in: query
 *         name: targetId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: targetType
 *         required: true
 *         schema: { type: string, enum: [doctor, lab, hospital] }
 *     responses:
 *       200: { description: List of reviews }
 */
router.get('/reviews', getReviews);

/**
 * @swagger
 * /api/patients/upload-profile-image:
 *   post:
 *     summary: Upload profile image
 *     tags: [Patient Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Image uploaded }
 */
router.post('/upload-profile-image', protect, upload.single('image'), uploadProfileImage);

module.exports = router;
