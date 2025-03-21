// models/emergencyContact.js
const { pool } = require('../config/database'); // Import connection pool

async function getAllEmergencyContacts() {
    try {
        const [rows] = await pool.query('SELECT * FROM EmergencyContacts');
        return rows;
    } catch (error) {
        console.error('Error fetching emergency contacts:', error);
        throw error;
    }
}

async function getEmergencyContactById(id) {
    try {
        const [rows] = await pool.query('SELECT * FROM EmergencyContacts WHERE ContactID = ?', [id]);
        return rows[0]; // Returns the first contact or undefined if not found
    } catch (error) {
        console.error('Error fetching emergency contact by ID:', error);
        throw error;
    }
}

async function createEmergencyContact(contactData) {
    // contactData should be an object with the fields for the EmergencyContacts table
    const { category, contactName, phoneNumber, address, latitude, longitude, city, state, country } = contactData;
    try {
        const [result] = await pool.query(
            'INSERT INTO EmergencyContacts (category, contactName, phoneNumber, address, latitude, longitude, city, state, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [category, contactName, phoneNumber, address, latitude, longitude, city, state, country]
        );
        return result.insertId; // Return the ID of the newly inserted contact
    } catch (error) {
        console.error('Error creating emergency contact:', error);
        throw error;
    }
}

// async function updateEmergencyContact(id, contactData) {
//     try {
//         if (!id || Object.keys(contactData).length === 0) {
//             throw new Error('Invalid ID or empty update data');
//         }

//         const updates = [];
//         const values = [];

//         for (const key in contactData) {
//             if (contactData.hasOwnProperty(key)) {
//                 updates.push(`${key} = ?`);
//                 values.push(contactData[key]);
//             }
//         }

//         values.push(id); // Add the contact ID for the WHERE clause

//         const sql = `UPDATE EmergencyContacts SET ${updates.join(', ')} WHERE ContactID = ?`;
//         const [result] = await pool.query(sql, values);

//         return result.affectedRows > 0 ? 'Update successful' : 'No record updated';
//     } catch (error) {
//         console.error('Error updating emergency contact:', error);
//         throw error;
//     }
// }

async function updateEmergencyContact(id, contactData) {
    try {
        if (!id || Object.keys(contactData).length === 0) {
            throw new Error('Invalid ID or empty update data');
        }

        const updates = [];
        const values = [];

        for (const key in contactData) {
            if (contactData[key] !== undefined && contactData[key] !== null) { // Ignore null values
                updates.push(`${key} = ?`);
                values.push(contactData[key]);
            }
        }

        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(id);
        const sql = `UPDATE EmergencyContacts SET ${updates.join(', ')} WHERE ContactID = ?`;

        console.log("SQL Query:", sql);
        console.log("SQL Values:", values);

        const [result] = await pool.query(sql, values);
        return result.affectedRows > 0 ? 'Update successful' : 'No record updated';
    } catch (error) {
        console.error('Error updating emergency contact:', error);
        throw error;
    }
}


async function deleteEmergencyContact(id) {
    try {
        await pool.query('DELETE FROM EmergencyContacts WHERE ContactID = ?', [id]);
    } catch (error) {
        console.error('Error deleting emergency contact:', error);
        throw error;
    }
}

// Add other functions for updating, deleting contacts as needed

// GET emergencyContactCount
async function getEmergencyContactCount() {
    try {
        const [rows] = await pool.query('SELECT COUNT(*) AS count FROM EmergencyContacts');
        return rows[0].count;
    } catch (error) {
        console.error('Error fetching emergency contact count:', error);
        throw error;
    }
}

module.exports = {
    getAllEmergencyContacts,
    getEmergencyContactById,
    createEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
    getEmergencyContactCount
};

// module.exports = {
//     getAllEmergencyContacts,
//     getEmergencyContactById,
//     createEmergencyContact,
// };