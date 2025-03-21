// models/blogPost.js
const { pool } = require('../config/database');

async function getAllBlogPosts() {
    try {
        const [rows] = await pool.query('SELECT * FROM BlogPosts');
        return rows;
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        throw error;
    }
}

async function getBlogPostById(id) {
    try {
        const [rows] = await pool.query('SELECT * FROM BlogPosts WHERE PostID = ?', [id]);
        return rows[0];
    } catch (error) {
        console.error('Error fetching blog post by ID:', error);
        throw error;
    }
}

async function createBlogPost(postData) {
    const { Title, Content, AuthorID, Category, PublicationDate, ScheduledDate, Status } = postData;
    try {
        const [result] = await pool.query(
            'INSERT INTO BlogPosts (Title, Content, AuthorID, Category, PublicationDate, ScheduledDate, Status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [Title, Content, AuthorID, Category, PublicationDate, ScheduledDate, Status]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating blog post:', error);
        throw error;
    }
}

async function scheduleBlogPost(id, scheduledDate) {
    try {
        await pool.query(
            'UPDATE BlogPosts SET ScheduledDate = ?, Status = ? WHERE PostID = ?',
            [scheduledDate, 'scheduled', id]
        );
    } catch (error) {
        console.error('Error scheduling blog post:', error);
        throw error;
    }
}

async function getBlogPostCount() {
    try {
        const [rows] = await pool.query('SELECT COUNT(*) AS count FROM BlogPosts');
        return rows[0].count;
    } catch (error) {
        console.error('Error fetching blog post count:', error);
        throw error;
    }
}

module.exports = {
    getAllBlogPosts,
    getBlogPostById,
    createBlogPost,
    scheduleBlogPost,
    getBlogPostCount
};