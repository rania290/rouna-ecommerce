const Product = require('../models/Product')
const User = require('../models/User')

// Service IA pour les recommandations
const aiService = require('../services/aiService')

// Obtenir des recommandations personnalisées pour un utilisateur
const getPersonalizedRecommendations = async (req, res) => {
  try {
    const { userId } = req.params
    const { limit = 8, productId } = req.query

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      })
    }

    // Obtenir les recommandations IA
    const recommendations = await aiService.getPersonalizedRecommendations(userId, {
      limit: parseInt(limit),
      excludeProduct: productId
    })

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recommandations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Obtenir des recommandations basées sur un produit
const getProductRecommendations = async (req, res) => {
  try {
    const { productId } = req.params
    const { limit = 6 } = req.query

    // Vérifier si le produit existe
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      })
    }

    // Obtenir les produits similaires
    const recommendations = await aiService.getSimilarProducts(productId, {
      limit: parseInt(limit)
    })

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations produit:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recommandations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Recherche intelligente avec IA
const intelligentSearch = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, limit = 10 } = req.query

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La requête de recherche doit contenir au moins 2 caractères'
      })
    }

    const results = await aiService.intelligentSearch(query.trim(), {
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      limit: parseInt(limit)
    })

    res.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Erreur lors de la recherche intelligente:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Chatbot IA
const chatWithAI = async (req, res) => {
  try {
    const { message, context = {} } = req.body

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le message ne peut pas être vide'
      })
    }

    const response = await aiService.chatWithAI(message.trim(), {
      userId: req.user?.id,
      context
    })

    res.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Erreur lors du chat IA:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la communication avec l\'IA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Obtenir les statistiques IA (pour admin)
const getAIStats = async (req, res) => {
  try {
    const stats = await aiService.getAIStatistics()

    res.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques IA:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

module.exports = {
  getPersonalizedRecommendations,
  getProductRecommendations,
  intelligentSearch,
  chatWithAI,
  getAIStats
}
