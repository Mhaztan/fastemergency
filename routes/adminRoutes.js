// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getAdminDashboard,
    approveRejectContact,
    banUnbanUser,
    getAllUsers, //import getAllUsers
    updateUser,
    deleteUser
} = require('../controllers/adminController');


router.get('/dashboard', protect, admin, getAdminDashboard);
router.post('/approve-contact/:id', protect, admin, approveRejectContact);
router.post('/users/:id/ban', protect, admin, banUnbanUser);

//get all users
router.get('/', protect, admin, getAllUsers); //Added getAllUsers
router.put('/:id', protect, admin, updateUser); //Protect The Updates
router.delete('/:id', protect, admin, deleteUser);

// Export the router
module.exports = router;