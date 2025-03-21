// routes/affiliateRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getAllAffiliateProducts,
    addAffiliateProduct,
    removeAffiliateProduct,
    trackAffiliateClick,
    getAffiliateEarnings
} = require('../controllers/affiliateController');

router.get('/products', getAllAffiliateProducts);
router.post('/products', protect, admin, addAffiliateProduct);
router.delete('/products/:id', protect, admin, removeAffiliateProduct);
router.post('/click/:id', trackAffiliateClick);
router.get('/earnings', protect, admin, getAffiliateEarnings);

module.exports = router;