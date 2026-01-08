const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { authMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

// Validation rules
const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom du produit est requis.')
    .isLength({ min: 3 })
    .withMessage('Le nom doit contenir au moins 3 caractères.'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('La description est requise.')
    .isLength({ min: 10 })
    .withMessage('La description doit contenir au moins 10 caractères.')
    .escape(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif.')
    .toFloat(),
  body('category')
    .notEmpty()
    .withMessage('La catégorie est requise.')
    .isMongoId()
    .withMessage('ID de catégorie invalide.'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Le stock doit être un nombre entier positif.')
    .toInt(),
  body('salePrice')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Le prix soldé doit être un nombre positif.')
    .toFloat(),
  body('weight')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Le poids doit être un nombre positif.')
    .toFloat(),
  body('dimensions')
    .optional()
    .customSanitizer(value => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return value;
    })
    .isObject()
    .withMessage('Les dimensions doivent être un objet.')
    .customSanitizer(dimensions => ({
      length: parseFloat(dimensions.length) || 0,
      width: parseFloat(dimensions.width) || 0,
      height: parseFloat(dimensions.height) || 0
    })),
  body('tags')
    .optional()
    .isString()
    .withMessage('Les tags doivent être une chaîne de caractères.'),
  body('colors')
    .optional()
    .isString()
    .withMessage('Les couleurs doivent être une chaîne de caractères.'),
  body('sizes')
    .optional()
    .isString()
    .withMessage('Les tailles doivent être une chaîne de caractères.')
];

// Public routes
router.get('/', productController.getProducts);
router.get('/popular', productController.getPopularProducts);
router.get('/sale', productController.getSaleProducts);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/related/:id', productController.getRelatedProducts);
router.get('/:id', productController.getProductById);

// Protected routes (admin only)
router.get(
  '/admin/all',
  authMiddleware,
  adminMiddleware,
  productController.getAdminProducts
);

router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.array('images', 5),
  productValidation,
  handleUploadError,
  productController.createProduct
);

router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  upload.array('images', 5),
  productValidation,
  handleUploadError,
  productController.updateProduct
);

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  productController.deleteProduct
);

router.patch(
  '/:id/toggle-active',
  authMiddleware,
  adminMiddleware,
  productController.toggleProductActive
);

module.exports = router;