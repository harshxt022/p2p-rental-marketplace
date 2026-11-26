const express = require('express');
const { createReview, getItemReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createReview);
router.get('/item/:itemId', getItemReviews);

module.exports = router;
