const express = require('express');
const { getTracking } = require('../controllers/trackingController');

const router = express.Router();

router.get('/', getTracking);

module.exports = router;
