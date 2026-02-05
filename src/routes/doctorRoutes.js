const express = require('express');
const router = express.Router();
const { getDoctors, getDoctorById, seedDoctors } = require('../controllers/doctorController');

router.get('/', getDoctors);
router.post('/seed', seedDoctors); // Use this once to populate DB
router.get('/:id', getDoctorById);

module.exports = router;
