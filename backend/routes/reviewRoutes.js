const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Validation rules
const reviewValidation = [
  body('productId')
    .isMongoId()
    .withMessage('ID de produit invalide.'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('La note doit être entre 1 et 5.'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Le commentaire est requis.')
    .isLength({ min: 10 })
    .withMessage('Le commentaire doit contenir au moins 10 caractères.')
];

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// User routes
router.post(
  '/',
  authMiddleware,
  reviewValidation,
  reviewController.createReview
);

router.get(
  '/my-reviews',
  authMiddleware,
  reviewController.getUserReviews
);

router.put(
  '/:id',
  authMiddleware,
  reviewValidation,
  reviewController.updateReview
);

router.delete(
  '/:id',
  authMiddleware,
  reviewController.deleteReview
);

router.post(
  '/:id/helpful',
  authMiddleware,
  reviewController.markHelpful
);

// Admin routes
router.patch(
  '/:id/approve',
  authMiddleware,
  adminMiddleware,
  reviewController.toggleReviewApproval
);

router.post(
  '/:id/response',
  authMiddleware,
  adminMiddleware,
  reviewController.addAdminResponse
);

module.exports = router;