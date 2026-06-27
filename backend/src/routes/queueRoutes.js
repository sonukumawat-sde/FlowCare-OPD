const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

// 1. GET /api/queue - Fetch current queue (Frontend starts here)
router.get('/queue', queueController.getQueueStatus);

// 2. POST /api/token - Quick Standard Token
router.post('/token', queueController.generateToken);

// 3. POST /api/token/emergency - Quick Emergency Token
router.post('/token/emergency', queueController.generateEmergencyToken);

// 4. POST /api/call-next - Call next patient to serving desk
router.post('/call-next', queueController.callNext);

// 5. POST /api/skip - Put patient on hold/skipped
router.post('/skip', queueController.skipToken);

// 6. POST /api/recall - Recall patient from skipped list
router.post('/recall', queueController.recallToken);

// 7. NAYA: POST /api/queue/add - Advanced Patient Form (Name, Age, Symptoms)
router.post('/queue/add', queueController.addAdvancedToken);

module.exports = router;