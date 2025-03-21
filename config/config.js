// // config/config.js
// require('dotenv').config(); // Load environment variables from .env file

// module.exports = {
//     port: process.env.PORT || 5500,
//     dbHost: process.env.DB_HOST || 'localhost',
//     dbUser: process.env.DB_USER || 'root',
//     dbPassword: process.env.DB_PASSWORD || 'password',
//     dbPort: process.env.DB_PORT,
//     ssl: {
//         rejectUnauthorized: true
//     },
//     dbName: process.env.DB_NAME || 'fastemergency',
//     jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
//     geminiApiKey: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY',
//     affiliateCommissionRate: parseFloat(process.env.AFFILIATE_COMMISSION_RATE) || 0.05,
// };



// config/config.js
require('dotenv').config(); // Load environment variables from .env file

module.exports = {
    port: process.env.PORT || 5500,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    geminiApiKey: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY',
    affiliateCommissionRate: parseFloat(process.env.AFFILIATE_COMMISSION_RATE) || 0.05,
    dbConnectionUri: process.env.DB_CONNECTION_URI // Add this
};