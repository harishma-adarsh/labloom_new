const express = require('express');
const router = express.Router();
const {
    addDoctorToHospital,
    getHospitalDoctors,
    removeDoctorFromHospital,
    getHospitalDashboard,
    getHospitalAppointments
} = require('../controllers/hospitalPortalController');
const { protect, verifyHospital, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorizeRoles('hospital', 'admin'));

/**
 * @swagger
 * tags:
 *   name: Hospital Portal
 *   description: Endpoints for healthcare facility management
 */

/**
 * @swagger
 * /api/hospital/add-doctor:
 *   post:
 *     summary: Associate a doctor with the hospital
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
router.post('/add-doctor', addDoctorToHospital);

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
router.get('/doctors', getHospitalDoctors);

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
router.delete('/doctors/:id', removeDoctorFromHospital);

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
router.get('/dashboard', getHospitalDashboard);

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
router.get('/appointments', getHospitalAppointments);

module.exports = router;
