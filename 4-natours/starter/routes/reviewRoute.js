const express = require('express'); // // kostur za route
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true }); // kostur za route

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

router
  .route('/delete/:id')
  .delete(authController.protect, reviewController.deleteReview);

router
  .route('/:id')
  .patch(authController.protect, reviewController.updatedReview);

module.exports = router; // // kostur za route
