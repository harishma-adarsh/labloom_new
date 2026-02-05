const express = require('express');
const router = express.Router();
const {
    getLabReports,
    getPrescriptions,
    requestRefill,
    setMedicationReminder,
    cancelMedicationReminder
} = require('../controllers/medicalRecordController');
const { protect } = require('../middleware/authMiddleware');

router.get('/lab-reports', protect, getLabReports);
router.get('/prescriptions', protect, getPrescriptions);
router.post('/prescriptions/:id/refill', protect, requestRefill);
router.put('/prescriptions/:id/reminder', protect, setMedicationReminder);
router.delete('/prescriptions/:id/reminder', protect, cancelMedicationReminder);

module.exports = router;
