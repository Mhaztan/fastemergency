// controllers/userController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const userModel = require('../models/user');
const config = require('../config/config');


// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check if user exists
    const userExists = await userModel.getUserByEmail(email);
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await userModel.createUser({
        Username: username,
        Email: email,
        PasswordHash: hashedPassword
    });

    // Generate token
    const token = jwt.sign({ id: newUser }, config.jwtSecret, {
        expiresIn: '30d'
    });

    res.status(201).json({
        message: 'User registered',
        token: token
    });
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check for user email
    const user = await userModel.getUserByEmail(email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user.UserID }, config.jwtSecret, {
        expiresIn: '30d'
    });

    res.status(200).json({
        message: 'Logged in',
        token: token
    });
});

// @desc    Authenticate an admin
// @route   POST /api/users/admin/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check for user email
    const user = await userModel.getUserByEmail(email);  //Same table

    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    //Check Role
    if (user.Role !== "admin") {
        return res.status(403).json({ message: "Not authorized as an admin" });  //403 Forbidden
    }

    // Generate token
    const token = jwt.sign({ id: user.UserID }, config.jwtSecret, {
        expiresIn: '30d'
    });

    res.status(200).json({
        message: 'Admin logged in',
        token: token
    });
});

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = {
        UserID: req.user.UserID,
        Username: req.user.Username,
        Email: req.user.Email,
        Role: req.user.Role
    };
    res.status(200).json(user);
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
    loginAdmin
};