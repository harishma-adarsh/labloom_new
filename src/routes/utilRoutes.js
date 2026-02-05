const express = require('express');
const router = express.Router();
const { searchCities } = require('../controllers/utilController');

router.get('/cities', searchCities);

module.exports = router;
