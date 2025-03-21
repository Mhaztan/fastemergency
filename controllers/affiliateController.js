// controllers/affiliateController.js
const asyncHandler = require('../utils/asyncHandler');
const affiliateProductModel = require('../models/affiliateProduct');
const affiliateClickModel = require('../models/affiliateClick');
const config = require('../config/config');
const affiliateService = require('../services/affiliateService');


// @desc    Get all affiliate products
// @route   GET /api/affiliates/products
// @access  Public
const getAllAffiliateProducts = asyncHandler(async (req, res) => {
    const products = await affiliateProductModel.getAllAffiliateProducts();
    res.status(200).json(products);
});

// @desc    Add a new affiliate product (Admin only)
// @route   POST /api/affiliates/products
// @access  Private (Admin)
const addAffiliateProduct = asyncHandler(async (req, res) => {
    const { productName, description, imageUrl, price, AliExpressLink } = req.body;

    if (!productName || !AliExpressLink) {
        return res.status(400).json({ message: 'Product name and AliExpress link are required' });
    }

    const newProductId = await affiliateProductModel.createAffiliateProduct({
        productName,
        description,
        imageUrl,
        price,
        AliExpressLink,
        AddedByUserID: req.user.UserID // Get Admin UserId from Auth Middleware
    });

    res.status(201).json({ message: 'Product added', productId: newProductId });
});

// @desc    Remove an affiliate product (Admin only)
// @route   DELETE /api/affiliates/products/:id
// @access  Private (Admin)
const removeAffiliateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await affiliateProductModel.deleteAffiliateProduct(id);
    res.status(200).json({ message: 'Product removed' });
});

// @desc    Track affiliate click
// @route   POST /api/affiliates/click/:id
// @access  Public
const trackAffiliateClick = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { UserID } = req.user ? req.user : { UserID: null }; // if user is logged in, otherwise null

    await affiliateClickModel.createAffiliateClick({
        ProductID: id,
        UserID: UserID
    });

    // Get the AliExpress link and redirect
    const product = await affiliateProductModel.getAffiliateProductById(id);
    if (product && product.AliExpressLink) {
        res.redirect(product.AliExpressLink);
    } else {
        res.status(404).json({ message: "Product not found" });
    }
});

// @desc    Get affiliate earnings
// @route   GET /api/affiliates/earnings
// @access  Private (Admin)
const getAffiliateEarnings = asyncHandler(async (req, res) => {
    const earningsData = await affiliateService.calculateEarnings();  // use the affiliate service
    res.status(200).json(earningsData);
});

module.exports = {
    getAllAffiliateProducts,
    addAffiliateProduct,
    removeAffiliateProduct,
    trackAffiliateClick,
    getAffiliateEarnings
};