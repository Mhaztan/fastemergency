// routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getAllBlogPosts,
    getBlogPostById,
    createBlogPost,
    generateBlogPost,
    scheduleBlogPost
} = require('../controllers/blogController');

router.get('/', getAllBlogPosts);
router.get('/:id', getBlogPostById);
router.post('/', protect, admin, createBlogPost);
router.post('/generate', protect, admin, generateBlogPost);
router.post('/schedule/:id', protect, admin, scheduleBlogPost);

module.exports = router;