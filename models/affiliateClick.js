// models/affiliateClick.js
const { pool } = require('../config/database');

async function createAffiliateClick(clickData) {
    const { ProductID, UserID } = clickData;

    try {
        const [result] = await pool.query(
            'INSERT INTO AffiliateClickTracking (ProductID, UserID) VALUES (?, ?)',
            [ProductID, UserID]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating affiliate click:', error);
        throw error;
    }
}

// Optional: Add methods to retrieve click data if needed for reporting

module.exports = {
    createAffiliateClick
};