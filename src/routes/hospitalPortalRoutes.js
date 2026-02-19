const express = require('express');
const router = express.Router();
const {
    getPopularHospitals,
    getHospitalDoctorsPublic,
    assignDoctorToHospital,
    addDoctorToHospital,
    manageSlots,
    completeAppointment,
    getHospitalDoctors,
    removeDoctorFromHospital,
    getHospitalFinance,
    getHospitalDashboard,
    getHospitalAppointments
} = require('../controllers/hospitalPortalController');
const { protect, verifyHospital, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Hospital Portal
 *   description: Endpoints for healthcare facility management
 */

// ===== PUBLIC ROUTES (No auth needed) =====

/**
 * @swagger
 * /api/hospital/popular:
 *   get:
 *     summary: List top-rated hospitals for the dashboard
 *     tags: [Hospital Portal]
 *     responses:
 *       200: { description: List of popular hospitals }
 */
router.get('/popular', getPopularHospitals);

/**
 * @swagger
 * /api/hospital/{id}/doctors:
 *   get:
 *     summary: View doctors working at a specific hospital
 *     tags: [Hospital Portal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of doctors }
 */
router.get('/:id/doctors', getHospitalDoctorsPublic);

// ===== PROTECTED ROUTES (Hospital admin only) =====

/**
 * @swagger
 * /api/hospital/doctors/assign:
 *   post:
 *     summary: Assign a doctor to the hospital staff
 *     tags: [Hospital Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId, department]
 *             properties:
 *               doctorId: { type: string }
 *               department: { type: string }
 *     responses:
 *       201: { description: Doctor assigned }
 */
router.post('/doctors/assign', protect, authorizeRoles('hospital', 'admin'), assignDoctorToHospital);

/**
 * @swagger
 * /api/hospital/add-doctor:
 *   post:
 *     summary: Associate a doctor with the hospital (legacy)
 *     tags: [Hospital Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId, department]
 *             properties:
 *               doctorId: { type: string }
 *               department: { type: string }
 *     responses:
 *       201: { description: Doctor added }
 */
router.post('/add-doctor', protect, authorizeRoles('hospital', 'admin'), addDoctorToHospital);

/**
 * @swagger
 * /api/hospital/slots/manage:
 *   post:
 *     summary: Define and assign time slots to specific doctors
 *     tags: [Hospital Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId, day, slots]
 *             properties:
 *               doctorId: { type: string }
 *               day: { type: string, enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday] }
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     startTime: { type: string }
 *                     endTime: { type: string }
 *     responses:
 *       200: { description: Slots updated }
 */
router.post('/slots/manage', protect, authorizeRoles('hospital', 'admin'), manageSlots);

/**
 * @swagger
 * /api/hospital/appointments/{id}/complete:
 *   patch:
 *     summary: Mark appointment as completed after the visit
 *     tags: [Hospital Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Appointment completed }
 */
router.patch('/appointments/:id/complete', protect, authorizeRoles('hospital', 'admin'), completeAppointment);

/**
 * @swagger
 * /api/hospital/finance:
 *   get:
 *     summary: View revenue reports (consultation fees collected for doctors)
 *     tags: [Hospital Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Revenue report }
 */
router.get('/finance', protect, authorizeRoles('hospital', 'admin'), getHospitalFinance);

/**
 * @swagger
 * /api/hospital/doctors:
 *   get:
 *     summary: List all doctors in hospital staff
 *     tags: [Hospital Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of doctors }
 */
router.get('/doctors', protect, authorizeRoles('hospital', 'admin'), getHospitalDoctors);

/**
 * @swagger
 * /api/hospital/doctors/{id}:
 *   delete:
 *     summary: Remove doctor from hospital staff
 *     tags: [Hospital Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Doctor removed }
 */
router.delete('/doctors/:id', protect, authorizeRoles('hospital', 'admin'), removeDoctorFromHospital);

/**
 * @swagger
 * /api/hospital/dashboard:
 *   get:
 *     summary: Overall stats for visits and revenue
 *     tags: [Hospital Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard stats }
 */
router.get('/dashboard', protect, authorizeRoles('hospital', 'admin'), getHospitalDashboard);

/**
 * @swagger
 * /api/hospital/appointments:
 *   get:
 *     summary: Integrated view of all appointments in the facility
 *     tags: [Hospital Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of appointments }
 */
router.get('/appointments', protect, authorizeRoles('hospital', 'admin'), getHospitalAppointments);

module.exports = router;
