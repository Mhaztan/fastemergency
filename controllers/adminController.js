// controllers/adminController.js
const asyncHandler = require('../utils/asyncHandler');
const userModel = require('../models/user');  // Assuming user management
const emergencyContactModel = require('../models/emergencyContact'); // Contact management
const blogPostModel = require('../models/blogPost');
const affiliateProductModel = require('../models/affiliateProduct');



// // @desc    Get Admin Dashboard Data
// // @route   GET /api/admin/dashboard
// // @access  Private (Admin)
// const getAdminDashboard = asyncHandler(async (req, res) => {
//     const userCount = await userModel.getUserCount(); // Implement this function in userModel
//     const contactCount = await emergencyContactModel.getEmergencyContactCount(); // Implement in emergencyContactModel
//     const blogCount = await blogPostModel.getBlogPostCount();
//     const affiliateProductCount = await affiliateProductModel.getAffiliateProductCount();

//     res.status(200).json({
//         userCount,
//         contactCount,
//         blogCount,
//         affiliateProductCount,
//     });
// });

// controllers/adminController.js

// @desc    Get Admin Dashboard Data
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getAdminDashboard = asyncHandler(async (req, res) => {
    const userCount = await userModel.getUserCount();
    // const contactCount = await emergencyContactModel.getEmergencyContactCount();
    const contactCount = await emergencyContactModel.getEmergencyContactCount(); // New function
    const blogCount = await blogPostModel.getBlogPostCount();
    const affiliateProductCount = await affiliateProductModel.getAffiliateProductCount();
    const usersLastMonth = await userModel.getUsersAddedLastMonth(); // New function

    res.status(200).json({
        userCount,
        contactCount,
        blogCount,
        affiliateProductCount,
        usersLastMonth,  // Include new data
    });
});

// @desc    Approve or Reject Emergency Contact
// @route   POST /api/admin/approve-contact/:id
// @access  Private (Admin)
const approveRejectContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body; // Status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected".' });
    }

    // Assuming req.user is the admin user
    await emergencyContactModel.updateContactStatus(id, status, req.user.UserID, notes);

    res.status(200).json({ message: `Contact ${id} ${status}` });
});

// @desc    Ban/Unban a User
// @route   POST /api/admin/users/:id/ban
// @access  Private (Admin)
const banUnbanUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isBanned } = req.body;  // Boolean value
    await userModel.updateUserBanStatus(id, isBanned);
    res.status(200).json({ message: `User ${id} ban status updated.` });
});


//GET all users // @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await userModel.getAllUsers();
    res.status(200).json(users);
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { Username, Email } = req.body; //Extract which can be changed

    if (!Username || !Email) {
        return res.status(400).json({ message: 'Username and Email are required to update the user' });
    }

    // Check if user exists
    const userExists = await userModel.getUserById(id);
    if (!userExists) {
        return res.status(404).json({ message: 'User not found' });
    }

    //Update the user using the Model and the userID
    await userModel.updateUser(id, { Username, Email });

    res.status(200).json({ message: `User ${id} updated` });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user exists
    const userExists = await userModel.getUserById(id);
    if (!userExists) {
        return res.status(404).json({ message: 'User not found' });
    }

    //Delete the user using the model and userID
    await userModel.deleteUser(id);
    res.status(200).json({ message: `User ${id} deleted` });
});

module.exports = {
    getAdminDashboard,
    approveRejectContact,
    banUnbanUser,
    getAllUsers,
    updateUser,
    deleteUser
};