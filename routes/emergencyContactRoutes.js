// routes/emergencyContactRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllEmergencyContacts,
    getEmergencyContactById,
    createEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
    getNearestEmergencyContacts // New route
} = require('../controllers/emergencyContactController');
const { protect, admin } = require('../middleware/authMiddleware'); // Example auth middleware

router.get('/', getAllEmergencyContacts);
router.get('/:id', getEmergencyContactById);
router.post('/', protect, createEmergencyContact);  // No longer requires Admin
router.get('/nearest', getNearestEmergencyContacts); // New route for nearest contacts

// Example route for updating an emergency contact (admin only)
router.put('/:id', protect, admin, updateEmergencyContact); // Admin only
router.delete('/:id', protect, admin, deleteEmergencyContact); // Admin only

module.exports = router;