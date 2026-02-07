const express = require('express');
const router = express.Router();
const {
    getDoctorAppointments,
    updateAppointmentStatus,
    getAppointmentDetails,
    getDoctorPatients,
    getPatientHistory,
    saveConsultationRecords,
    issuePrescription
} = require('../controllers/doctorPortalController');
const { protect, verifyDoctor } = require('../middleware/authMiddleware');

// Base path will be /api in index.js, so these will be /api/doctor/... or /api/appointments/...
// But since the requirements grouped them, I'll mount them accordingly in index.js

// Doctor specific routes
/**
 * @swagger
 * tags:
 *   name: Doctor Portal
 *   description: Endpoints for doctor schedule and patient management
 */

/**
 * @swagger
 * /api/doctor/appointments:
 *   get:
 *     summary: Get doctor's daily schedule
 *     tags: [Doctor Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: List of appointments }
 */
router.get('/appointments', protect, verifyDoctor, getDoctorAppointments);

/**
 * @swagger
 * /api/doctor/patients:
 *   get:
 *     summary: Get doctor's patient list
 *     tags: [Doctor Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of patients }
 */
router.get('/patients', protect, verifyDoctor, getDoctorPatients);

/**
 * @swagger
 * /api/doctor/appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status (Accept/Complete/Cancel)
 *     tags: [Doctor Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 *               reason: { type: string }
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/appointments/:id/status', protect, verifyDoctor, updateAppointmentStatus);

/**
 * @swagger
 * /api/doctor/appointments/{id}:
 *   get:
 *     summary: Get detailed appointment view
 *     tags: [Doctor Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Appointment details }
 */
router.get('/appointments/:id', protect, getAppointmentDetails);

/**
 * @swagger
 * /api/doctor/patients/{id}/history:
 *   get:
 *     summary: Get authorized patient medical history
 *     tags: [Doctor Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Patient history }
 */
router.get('/patients/:id/history', protect, verifyDoctor, getPatientHistory);

/**
 * @swagger
 * /api/doctor/consultations/{appointmentId}/records:
 *   post:
 *     summary: Save diagnosis and clinical notes
 *     tags: [Doctor Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Records saved }
 */
router.post('/consultations/:appointmentId/records', protect, verifyDoctor, saveConsultationRecords);

/**
 * @swagger
 * /api/doctor/consultations/{appointmentId}/prescribe:
 *   post:
 *     summary: Issue digital prescription
 *     tags: [Doctor Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prescriptions: { type: array, items: { type: object } }
 *     responses:
 *       200: { description: Prescription issued }
 */
router.post('/consultations/:appointmentId/prescribe', protect, verifyDoctor, issuePrescription);

module.exports = router;
