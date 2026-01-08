const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Validation rules
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom de la catégorie est requis.')
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères.')
];

// Public routes
router.get('/', categoryController.getCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Protected routes (admin only)
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  categoryValidation,
  categoryController.createCategory
);

router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  categoryValidation,
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  categoryController.deleteCategory
);

module.exports = router;