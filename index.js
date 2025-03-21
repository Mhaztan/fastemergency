// server.js
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database'); // Import db test function
const emergencyContactRoutes = require('./routes/emergencyContactRoutes');
const userRoutes = require('./routes/userRoutes');
const blogRoutes = require('./routes/blogRoutes');
const affiliateRoutes = require('./routes/affiliateRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const i18nMiddleware = require('./middleware/i18nMiddleware'); 
const config = require('./config/config');

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
})); // Enable CORS for all origins (adjust as needed)
app.use(express.json()); // Parse JSON request bodies

// Apply i18n middleware - before all routes
app.use(i18nMiddleware);

// Test the database connection
testConnection();

// Routes
app.use('/api/emergency-contacts', emergencyContactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/affiliates', affiliateRoutes);

// Admin routes (only accessible to admin users)
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use(errorHandler);

const port = config.port || 5500; // Use port from config or default to 5000

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});