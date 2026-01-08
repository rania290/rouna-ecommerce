const express = require('express')
const router = express.Router()

// Importer le contrôleur IA
const aiController = require('../controllers/aiController')

// Importer le middleware d'authentification si nécessaire
const { authMiddleware } = require('../middleware/authMiddleware')

// Routes IA publiques (pas besoin d'authentification)
router.get('/search', aiController.intelligentSearch)
router.post('/chat', aiController.chatWithAI)

// Routes IA nécessitant une authentification
router.get('/recommendations/user/:userId', authMiddleware, aiController.getPersonalizedRecommendations)
router.get('/recommendations/product/:productId', aiController.getProductRecommendations)

// Route admin pour les statistiques IA
router.get('/stats', authMiddleware, aiController.getAIStats)

module.exports = router
