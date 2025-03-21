// models/affiliateProduct.js
const { pool } = require('../config/database');

async function getAllAffiliateProducts() {
    try {
        const [rows] = await pool.query('SELECT * FROM AffiliateProducts');
        return rows;
    } catch (error) {
        console.error('Error fetching affiliate products:', error);
        throw error;
    }
}

async function getAffiliateProductById(id) {
    try {
        const [rows] = await pool.query('SELECT * FROM AffiliateProducts WHERE ProductID = ?', [id]);
        return rows[0];
    } catch (error) {
        console.error('Error fetching affiliate product by ID:', error);
        throw error;
    }
}


async function createAffiliateProduct(productData) {
    const { productName, description, imageUrl, price, AliExpressLink, AddedByUserID } = productData;
    try {
        const [result] = await pool.query(
            'INSERT INTO AffiliateProducts (ProductName, Description, ImageUrl, Price, AliExpressLink, AddedByUserID) VALUES (?, ?, ?, ?, ?, ?)',
            [productName, description, imageUrl, price, AliExpressLink, AddedByUserID]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating affiliate product:', error);
        throw error;
    }
}

async function deleteAffiliateProduct(id) {
    try {
        await pool.query('DELETE FROM AffiliateProducts WHERE ProductID = ?', [id]);
    } catch (error) {
        console.error('Error deleting affiliate product:', error);
        throw error;
    }
}

async function getAffiliateProductCount() {
    try {
        const [rows] = await pool.query('SELECT COUNT(*) AS count FROM AffiliateProducts');
        return rows[0].count;
    } catch (error) {
        console.error('Error fetching affiliate product count:', error);
        throw error;
    }
}

module.exports = {
    getAllAffiliateProducts,
    getAffiliateProductById,
    createAffiliateProduct,
    deleteAffiliateProduct,
    getAffiliateProductCount
};