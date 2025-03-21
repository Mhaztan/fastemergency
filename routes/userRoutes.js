// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    registerUser,
    loginUser,
    getMe,
    loginAdmin //Added Admin login Route
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);

router.post('/admin/login', loginAdmin); //Added Admin login Route

router.get('/me', protect, getMe);

module.exports = router;