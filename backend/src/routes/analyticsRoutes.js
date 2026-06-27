const express = require('express');
const router = express.Router();

// Controller se function import kiya (Jo humne pichle step me banaya tha)
const { getDashboardStats } = require('../controllers/analyticsController');

// Jab frontend '/api/analytics' ko bulayega, toh getDashboardStats chalega
router.get('/analytics', getDashboardStats);

module.exports = router;