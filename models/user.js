// models/user.js
const { pool } = require('../config/database');

async function createUser(userData) {
    const { Username, Email, PasswordHash } = userData;
    try {
        const [result] = await pool.query(
            'INSERT INTO Users (Username, Email, PasswordHash) VALUES (?, ?, ?)',
            [Username, Email, PasswordHash]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

async function getUserByEmail(email) {
    try {
        const [rows] = await pool.query('SELECT * FROM Users WHERE Email = ?', [email]);
        return rows[0];
    } catch (error) {
        console.error('Error fetching user by email:', error);
        throw error;
    }
}

async function updateUserBanStatus(userId, isBanned) {
    try {
        await pool.query('UPDATE Users SET IsBanned = ? WHERE UserID = ?', [isBanned, userId]);
    } catch (error) {
        console.error('Error updating user ban status:', error);
        throw error;
    }
}

async function getUserCount() {
    try {
        const [rows] = await pool.query('SELECT COUNT(*) AS count FROM Users');
        return rows[0].count;
    } catch (error) {
        console.error('Error fetching user count:', error);
        throw error;
    }
}



async function getUsersAddedLastMonth() {
    try {
        const [rows] = await pool.query(
            "SELECT COUNT(*) AS count FROM Users WHERE RegistrationDate >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)"
        );
        return rows[0].count;
    } catch (error) {
        console.error('Error fetching users added last month:', error);
        throw error;
    }
}

async function getAllUsers() {
    try {
        const [rows] = await pool.query('SELECT * FROM Users');
        return rows;
    } catch (error) {
        console.error('Error fetching all users:', error);
        throw error;
    }
}

async function getUserById(id) {
    try {
        const [rows] = await pool.query('SELECT * FROM Users WHERE UserID = ?', [id]);
        return rows[0];
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        throw error;
    }
}

async function updateUser(id, userData) {
    try {
        const { Username, Email } = userData;
        await pool.query(
            'UPDATE Users SET Username = ?, Email = ? WHERE UserID = ?',
            [Username, Email, id]
        );
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

async function deleteUser(id) {
    try {
        await pool.query('DELETE FROM Users WHERE UserID = ?', [id]);
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

module.exports = {
    createUser,
    getUserByEmail,
    updateUserBanStatus,
    getUserCount,
    getUsersAddedLastMonth,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUsersAddedLastMonth,
};