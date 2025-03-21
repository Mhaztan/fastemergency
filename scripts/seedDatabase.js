// scripts/seedDatabase.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    try {
        // Clear existing data (optional - be careful in production!)
        await pool.query('DELETE FROM Users');  //Careful!!
        await pool.query('DELETE FROM EmergencyContacts');

        // Create a default admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await pool.query(
            'INSERT INTO Users (Username, Email, PasswordHash, Role) VALUES (?, ?, ?, ?)',
            ['admin', 'admin@example.com', hashedPassword, 'admin']
        );

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        process.exit();  // Exit the script
    }
}

seedDatabase(); // Run the seeding function