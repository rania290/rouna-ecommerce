const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');

const router = express.Router();

// Routes protégées par authentification
router.use(authMiddleware);

// Récupérer le panier de l'utilisateur
router.get('/', cartController.getCart);

// Synchroniser le panier
router.post('/sync', cartController.syncCart);

// Vider le panier
router.delete('/', cartController.clearCart);

// Mettre à jour un article du panier
router.put('/items/:itemId', cartController.updateCartItem);

// Supprimer un article du panier
router.delete('/items/:itemId', cartController.removeCartItem);

module.exports = router;
