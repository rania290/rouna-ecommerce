const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const wishlistController = require('../controllers/wishlistController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Validation rules
const wishlistValidation = [
  body('productId')
    .isMongoId()
    .withMessage('ID de produit invalide.')
];

// User routes
router.post(
  '/',
  authMiddleware,
  wishlistValidation,
  wishlistController.addToWishlist
);

router.get(
  '/',
  authMiddleware,
  wishlistController.getWishlist
);

router.get(
  '/check/:productId',
  authMiddleware,
  wishlistController.checkInWishlist
);

router.delete(
  '/:id',
  authMiddleware,
  wishlistController.removeFromWishlist
);

router.delete(
  '/',
  authMiddleware,
  wishlistController.clearWishlist
);

module.exports = router;