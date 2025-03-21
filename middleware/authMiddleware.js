// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { pool } = require('../config/database'); // Import connection pool
const asyncHandler = require('../utils/asyncHandler');

// Middleware to protect routes - verifies JWT token
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, config.jwtSecret);

            // Get user from the database using the decoded user ID
            const [rows] = await pool.query('SELECT * FROM Users WHERE UserID = ?', [decoded.id]);

            if (!rows || rows.length === 0) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = rows[0]; // Attach the user object to the request
            next(); // Call the next middleware
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
});

// Middleware to check if the user is an admin
const admin = (req, res, next) => {
    if (req.user && req.user.Role === 'admin') {
        next(); // User is an admin, proceed
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };