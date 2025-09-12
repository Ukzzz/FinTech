// routes/auth.js
const express = require('express');
const { login, signup } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/register', signup);

module.exports = router;