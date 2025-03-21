// // config/database.js
// const mysql = require('mysql2/promise'); // Use promise-based MySQL library
// const config = require('./config'); // Load configuration

// const pool = mysql.createPool({
//     host: config.dbHost,
//     user: config.dbUser,
//     password: config.dbPassword,
//     database: config.dbName,
//     dbPort: config.dbPort,
//     ssl: config.ssl,
//     waitForConnections: true,
//     connectionLimit: 10, // Adjust as needed
//     queueLimit: 0
// });

// async function testConnection() {
//     try {
//         const connection = await pool.getConnection();
//         console.log('Database connected successfully!');
//         connection.release(); // Release the connection back to the pool
//     } catch (error) {
//         console.error('Database connection failed:', error);
//         process.exit(1); // Exit if the database connection fails
//     }
// }

// module.exports = { pool, testConnection }; // Export connection pool and test function

// config/database.js
const mysql = require('mysql2/promise'); // Use promise-based MySQL library
const config = require('./config'); // Load configuration

const pool = mysql.createPool({
    uri: config.dbConnectionUri,  // Use the connection URI
    waitForConnections: true,
    connectionLimit: 10, // Adjust as needed
    queueLimit: 0,
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully!');
        connection.release(); // Release the connection back to the pool
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1); // Exit if the database connection fails
    }
}

module.exports = { pool, testConnection }; // Export connection pool and test function