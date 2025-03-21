// controllers/blogController.js
const asyncHandler = require('../utils/asyncHandler');
const blogPostModel = require('../models/blogPost');
const aiService = require('../services/aiService');
const config = require('../config/config'); // For Gemini API Key

// @desc    Get all blog posts
// @route   GET /api/blogs
// @access  Public
const getAllBlogPosts = asyncHandler(async (req, res) => {
    const posts = await blogPostModel.getAllBlogPosts();
    res.status(200).json(posts);
});

// @desc    Get a single blog post
// @route   GET /api/blogs/:id
// @access  Public
const getBlogPostById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await blogPostModel.getBlogPostById(id);
    if (!post) {
        return res.status(404).json({ message: 'Blog post not found' });
    }
    res.status(200).json(post);
});

// // @desc    Create a new blog post (Admin only)
// // @route   POST /api/blogs
// // @access  Private (Admin)
// const createBlogPost = asyncHandler(async (req, res) => {
//     const { title, content, category, scheduledDate } = req.body;  //Include a scheduled date

//     if (!title || !content || !category) {
//         return res.status(400).json({ message: 'Title, content and category are required' });
//     }

//     const newPostId = await blogPostModel.createBlogPost({
//         Title: title,
//         Content: content,
//         AuthorID: req.user.UserID,  // Get Admin UserId from Auth Middleware
//         Category: category,
//         PublicationDate: (scheduledDate ? null : new Date()), //Publish now if no date
//         ScheduledDate: scheduledDate ? scheduledDate : null,
//         Status: (scheduledDate ? 'scheduled' : 'published'),  //Set Status to scheduled if needed
//     });

//     res.status(201).json({ message: 'Blog post created', postId: newPostId });
// });

// @desc    Create a new blog post (Admin only)
// @route   POST /api/blogs
// @access  Private (Admin)
const createBlogPost = asyncHandler(async (req, res) => {
    const { title, content, category, scheduledDate } = req.body;

    if (!title || !content || !category) {
        return res.status(400).json({ message: 'Title, content, and category are required' });
    }

    // Set default values for publication date and status
    const publicationDate = scheduledDate ? null : new Date();
    const status = scheduledDate ? 'scheduled' : 'published';

    try {
        const newPostId = await blogPostModel.createBlogPost({
            Title: title,
            Content: content,
            AuthorID: req.user.UserID,  // Extract Admin UserID from Auth Middleware
            Category: category,
            PublicationDate: publicationDate,
            ScheduledDate: scheduledDate || null,
            Status: status
        });

        res.status(201).json({ message: 'Blog post created', postId: newPostId });
    } catch (error) {
        console.error('Error creating blog post:', error);
        res.status(500).json({ message: 'Server error while creating blog post' });
    }
});


// @desc    Generate a blog post using AI
// @route   POST /api/blogs/generate
// @access  Private (Admin)
const generateBlogPost = asyncHandler(async (req, res) => {
    const { topic, category } = req.body;

    if (!topic || !category) {
        return res.status(400).json({ message: 'Topic and category are required' });
    }

    const aiContent = await aiService.generateBlogContent(topic, config.geminiApiKey);  // Use Gemini

    // You might want to save the AI generated content to the database here, perhaps with a 'draft' status.
    res.status(200).json({ content: aiContent });
});

// @desc    Schedule a blog post for auto-publishing
// @route   POST /api/blogs/schedule/:id
// @access  Private (Admin)

const scheduleBlogPost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { scheduledDate } = req.body;

    if (!scheduledDate) {
        return res.status(400).json({ message: 'Schedule Date is required.' });
    }

    await blogPostModel.scheduleBlogPost(id, scheduledDate);

    res.status(200).json({ message: "Scheduled Successfully." });
});

module.exports = {
    getAllBlogPosts,
    getBlogPostById,
    createBlogPost,
    generateBlogPost,
    scheduleBlogPost,
};