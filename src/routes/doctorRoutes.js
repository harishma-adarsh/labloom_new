const express = require('express');
const router = express.Router();
const { getDoctors, searchDoctors, getDoctorDetails, getDoctorSlots, getDoctorById, seedDoctors } = require('../controllers/doctorController');

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Public doctor search and discovery
 */

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     responses:
 *       200: { description: List of doctors }
 */
router.get('/', getDoctors);

/**
 * @swagger
 * /api/doctors/search:
 *   get:
 *     summary: Search doctors by name, specialty, or hospital
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *       - in: query
 *         name: specialty
 *         schema: { type: string }
 *       - in: query
 *         name: hospital
 *         schema: { type: string }
 *     responses:
 *       200: { description: Search results }
 */
router.get('/search', searchDoctors);

/**
 * @swagger
 * /api/doctors/seed:
 *   post:
 *     summary: Seed sample doctors (Dev only)
 *     tags: [Doctors]
 *     responses:
 *       200: { description: Seeded doctors }
 */
router.post('/seed', seedDoctors);

/**
 * @swagger
 * /api/doctors/{id}/details:
 *   get:
 *     summary: Get doctor bio, experience, consultation fee, and patient reviews
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Doctor details with reviews }
 */
router.get('/:id/details', getDoctorDetails);

/**
 * @swagger
 * /api/doctors/{id}/slots:
 *   get:
 *     summary: Get available time slots for a doctor
 *     tags: [Doctors]
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
 *       200: { description: Available slots }
 */
router.get('/:id/slots', getDoctorSlots);

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Doctor details }
 */
router.get('/:id', getDoctorById);

module.exports = router;
