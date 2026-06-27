const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Jab frontend se /register pe POST request aayegi, toh registerUser function chalega
router.post('/register', registerUser);

// Jab /login pe request aayegi, toh loginUser chalega
router.post('/login', loginUser);

module.exports = router;