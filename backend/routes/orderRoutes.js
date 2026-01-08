const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Validation rules
const orderValidation = [
  body('shippingAddress.firstName')
    .trim()
    .notEmpty()
    .withMessage('Le prénom est requis.'),
  body('shippingAddress.lastName')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis.'),
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('L\'adresse est requise.'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('La ville est requise.'),
  body('shippingAddress.postalCode')
    .trim()
    .notEmpty()
    .withMessage('Le code postal est requis.'),
  body('shippingAddress.country')
    .trim()
    .notEmpty()
    .withMessage('Le pays est requis.'),
  body('shippingAddress.phone')
    .trim()
    .notEmpty()
    .withMessage('Le téléphone est requis.'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Au moins un produit est requis.'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('ID de produit invalide.'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être au moins 1.'),
  body('paymentMethod')
    .isIn(['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'])
    .withMessage('Méthode de paiement invalide.')
];

// User routes
router.post(
  '/',
  authMiddleware,
  orderValidation,
  orderController.createOrder
);

router.get(
  '/my-orders',
  authMiddleware,
  orderController.getUserOrders
);

router.get(
  '/my-orders/:id',
  authMiddleware,
  orderController.getOrderById
);

router.post(
  '/:id/cancel',
  authMiddleware,
  orderController.cancelOrder
);

router.get(
  '/:id/pdf',
  authMiddleware,
  orderController.downloadOrderPDF
);

// Admin routes
router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  orderController.getAllOrders
);

router.get(
  '/stats',
  authMiddleware,
  adminMiddleware,
  orderController.getOrderStats
);

router.patch(
  '/:id/status',
  authMiddleware,
  adminMiddleware,
  orderController.updateOrderStatus
);

module.exports = router;
