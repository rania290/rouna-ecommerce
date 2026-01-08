const Product = require('../models/Product')
const User = require('../models/User')
const Order = require('../models/Order')
const aiConfig = require('../config/ai')
const OpenAI = require('openai')

// Cache simple en mémoire pour les recommandations
const recommendationCache = new Map()

class AIService {
  constructor() {
    this.cache = recommendationCache
  }

  // Nettoyer le cache périodiquement
  cleanCache() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > (aiConfig.cache.ttl * 1000)) {
        this.cache.delete(key)
      }
    }
  }

  // Obtenir des recommandations personnalisées pour un utilisateur
  async getPersonalizedRecommendations(userId, options = {}) {
    const { limit = 8, excludeProduct } = options
    const cacheKey = `personalized_${userId}_${limit}_${excludeProduct || 'none'}`

    // Vérifier le cache
    if (aiConfig.cache.enabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < (aiConfig.cache.ttl * 1000)) {
        return cached.data
      }
    }

    try {
      // Obtenir l'historique de l'utilisateur
      const userHistory = await this.getUserPurchaseHistory(userId)
      const userPreferences = await this.getUserPreferences(userId)

      let recommendations = []

      // Recommandations basées sur l'historique d'achat
      if (userHistory.categories.length > 0) {
        const categoryRecommendations = await this.getRecommendationsByCategories(
          userHistory.categories,
          { limit: Math.ceil(limit * aiConfig.recommendations.userHistoryWeight), excludeProduct }
        )
        recommendations.push(...categoryRecommendations)
      }

      // Recommandations populaires générales
      const popularProducts = await this.getPopularProducts({
        limit: Math.ceil(limit * 0.4),
        excludeProduct,
        excludeCategories: userHistory.categories
      })
      recommendations.push(...popularProducts)

      // Recommandations basées sur les notes
      const topRatedProducts = await this.getTopRatedProducts({
        limit: Math.ceil(limit * aiConfig.recommendations.ratingWeight),
        excludeProduct
      })
      recommendations.push(...topRatedProducts)

      // Supprimer les doublons et limiter
      const uniqueRecommendations = this.removeDuplicates(recommendations)
        .slice(0, limit)

      // Mettre en cache
      if (aiConfig.cache.enabled) {
        this.cache.set(cacheKey, {
          data: uniqueRecommendations,
          timestamp: Date.now()
        })
      }

      return uniqueRecommendations

    } catch (error) {
      console.error('Erreur dans getPersonalizedRecommendations:', error)
      // Fallback: retourner des produits populaires
      return await this.getPopularProducts({ limit, excludeProduct })
    }
  }

  // Obtenir des produits similaires
  async getSimilarProducts(productId, options = {}) {
    const { limit = 6 } = options
    const cacheKey = `similar_${productId}_${limit}`

    // Vérifier le cache
    if (aiConfig.cache.enabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < (aiConfig.cache.ttl * 1000)) {
        return cached.data
      }
    }

    try {
      // Obtenir le produit de référence
      const product = await Product.findById(productId).populate('category')
      if (!product) return []

      // Trouver des produits similaires par catégorie
      let similarProducts = await Product.find({
        category: product.category._id,
        _id: { $ne: productId },
        isActive: true
      })
        .limit(limit * 2)
        .sort({ 'rating.average': -1, createdAt: -1 })

      // Si pas assez de produits dans la même catégorie, chercher par tags similaires
      if (similarProducts.length < limit && product.tags.length > 0) {
        const tagProducts = await Product.find({
          tags: { $in: product.tags },
          _id: { $ne: productId },
          category: { $ne: product.category._id },
          isActive: true
        })
          .limit(limit - similarProducts.length)
          .sort({ 'rating.average': -1 })

        similarProducts.push(...tagProducts)
      }

      // Supprimer les doublons et limiter
      const uniqueProducts = this.removeDuplicates(similarProducts).slice(0, limit)

      // Mettre en cache
      if (aiConfig.cache.enabled) {
        this.cache.set(cacheKey, {
          data: uniqueProducts,
          timestamp: Date.now()
        })
      }

      return uniqueProducts

    } catch (error) {
      console.error('Erreur dans getSimilarProducts:', error)
      return []
    }
  }

  // Recherche intelligente avec IA
  async intelligentSearch(query, options = {}) {
    const { category, minPrice, maxPrice, limit = 10 } = options

    try {
      // Recherche textuelle de base
      const searchQuery = {
        $text: { $search: query },
        isActive: true
      }

      // Ajouter les filtres
      if (category) searchQuery.category = category
      if (minPrice !== undefined || maxPrice !== undefined) {
        searchQuery.price = {}
        if (minPrice !== undefined) searchQuery.price.$gte = minPrice
        if (maxPrice !== undefined) searchQuery.price.$lte = maxPrice
      }

      // Recherche principale
      const products = await Product.find(searchQuery, {
        score: { $meta: 'textScore' }
      })
        .populate('category')
        .sort({ score: { $meta: 'textScore' }, 'rating.average': -1 })
        .limit(limit)

      // Générer des suggestions IA
      const suggestions = this.generateSearchSuggestions(query)

      return {
        products: products || [],
        suggestions: suggestions || [],
        query: query,
        totalResults: products ? products.length : 0
      }

    } catch (error) {
      console.error('Erreur dans intelligentSearch:', error)
      return { products: [], suggestions: [], query, totalResults: 0 }
    }
  }

  // Chatbot IA avec OpenAI
  async chatWithAI(message, context = {}) {
    const { userId, previousMessages = [] } = context

    try {
      // Initialiser OpenAI
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })

      // Prompt système pour définir le rôle du chatbot
      const systemPrompt = `Vous êtes Rouna, l'assistant IA d'une boutique de bijoux en ligne spécialisée dans les bijoux raffinés : colliers, gourmettes, bracelets et bagues.

INFORMATIONS SUR LA BOUTIQUE :
- Nom : Rouna
- Spécialité : Bijoux raffinés (colliers, gourmettes, bracelets, bagues)
- Devise : Dinars tunisiens (DT)
- Livraison : Gratuite sur toutes les commandes
- Retours : 30 jours pour articles non portés, dans leur emballage d'origine
- CONTACT DIRECT : 
    * Email : contact@rouna.com
    * Téléphone/WhatsApp : +216 54 398 397
    * Adresse : Tunis, Tunisie
- Paiement : Paiement à la livraison (Cash on Delivery), Carte bancaire, PayPal

VOTRE RÔLE :
- Soyez amical, premium et professionnel.
- Répondez TOUJOURS en français, sauf si le client parle une autre langue.
- Si le client demande comment vous CONTACTER ou demande du SUPPORT, donnez IMMÉDIATEMENT l'email (contact@rouna.com) et le téléphone (+216 54 398 397).
- Aidez les clients à choisir des bijoux en fonction de leurs goûts.
- Pour les questions sur le statut des commandes ou les retours, expliquez la politique et proposez de contacter le support pour un suivi personnalisé.
- Restez concentré sur l'univers de la bijouterie Rouna.

CONSIGNES DE RÉPONSE :
- Soyez concis mais chaleureux.
- Utilisez des emojis de manière élégante (✨, 💎, 💍).`

      // Préparer les messages pour OpenAI
      const messages = [
        { role: 'system', content: systemPrompt }
      ]

      // Ajouter l'historique des messages précédents (limité aux 5 derniers pour économie)
      const recentMessages = previousMessages.slice(-5)
      recentMessages.forEach(prevMsg => {
        messages.push({
          role: prevMsg.role === 'bot' ? 'assistant' : 'user',
          content: prevMsg.content
        })
      })

      // Ajouter le message actuel
      messages.push({ role: 'user', content: message })

      // Appeler l'API OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })

      const aiResponse = completion.choices[0].message.content

      // Générer des suggestions basées sur la réponse
      const suggestions = this.generateChatSuggestions(aiResponse, message)

      return {
        message: aiResponse,
        suggestions: suggestions,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('Erreur dans chatWithAI (OpenAI):', error)

      // Fallback vers les réponses prédéfinies en cas d'erreur API
      return this.fallbackChatResponse(message)
    }
  }

  // Générer des suggestions basées sur la réponse et le message
  generateChatSuggestions(response, originalMessage) {
    const lowerResponse = response.toLowerCase()
    const lowerMessage = originalMessage.toLowerCase()

    const suggestions = []

    // Suggestions basées sur le contenu de la réponse ou du message original
    const isContactQuery = /(contact|support|aide|vontacte|joindre|email|téléphone)/i.test(lowerMessage) ||
      /(contact|support|aide|email|téléphone)/i.test(lowerResponse);

    if (lowerResponse.includes('produit') || lowerResponse.includes('bijou') || lowerResponse.includes('collection')) {
      suggestions.push('Voir les produits', 'Voir la collection')
    }

    if (lowerResponse.includes('commande') || lowerResponse.includes('suivre') || lowerResponse.includes('livraison')) {
      suggestions.push('Suivre ma commande', 'Voir mon historique')
    }

    if (isContactQuery) {
      suggestions.push('Nous contacter', 'FAQ')
    }

    if (lowerResponse.includes('retour') || lowerResponse.includes('remboursement')) {
      suggestions.push('Conditions de retour', 'Contacter le SAV')
    }

    // Suggestions par défaut si aucune n'a été trouvée
    if (suggestions.length === 0) {
      suggestions.push('Voir les produits', 'Nous contacter')
    }

    return suggestions.slice(0, 3) // Limiter à 3 suggestions
  }

  // Réponses de fallback en cas d'erreur API
  fallbackChatResponse(message) {
    const lowerMessage = message.toLowerCase().trim()

    let response = ''
    let suggestions = []

    // Réponses de base en cas d'erreur API
    if (/(bonjour|salut|coucou|hello|hi|hey)/i.test(lowerMessage)) {
      response = 'Bonjour ! ✨ Je suis Rouna, votre assistant IA. Comment puis-je vous aider à trouver le bijou parfait aujourd\'hui ?'
      suggestions = ['Voir les produits', 'Voir la collection', 'Nous contacter']
    } else if (/(contact|support|aide|vontacte|joindre|email|téléphone)/i.test(lowerMessage)) {
      response = 'Vous pouvez nous contacter directement par email à contact@rouna.com ou par téléphone/WhatsApp au +216 54 398 397. Nous sommes là pour vous aider ! 💎'
      suggestions = ['Nous contacter', 'FAQ', 'Conditions de retour']
    } else if (/(produit|bijou|collier|bague|bracelet)/i.test(lowerMessage)) {
      response = 'Nous avons une magnifique collection de bijoux artisanaux : colliers, gourmettes, bracelets et bagues. Que recherchez-vous en particulier ? 💍'
      suggestions = ['Voir les colliers', 'Voir les bagues', 'Voir les bracelets']
    } else {
      response = 'Je suis là pour vous accompagner dans votre recherche de bijoux Rouna. N\'hésitez pas à me poser vos questions sur nos produits, la livraison ou comment nous contacter ! ✨'
      suggestions = ['Voir les produits', 'Nous contacter', 'FAQ']
    }

    return {
      message: response,
      suggestions: suggestions,
      timestamp: new Date().toISOString()
    }
  }

  // Méthodes utilitaires privées

  async getUserPurchaseHistory(userId) {
    try {
      const orders = await Order.find({ user: userId })
        .populate('items.product')
        .sort({ createdAt: -1 })
        .limit(10)

      const categories = []
      const products = []

      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (item && item.product && item.product._id && item.product.category) {
              categories.push(item.product.category.toString())
              products.push(item.product._id.toString())
            }
          })
        }
      })

      return {
        categories: [...new Set(categories)],
        products: [...new Set(products)],
        totalOrders: orders.length
      }
    } catch (error) {
      console.error('Erreur dans getUserPurchaseHistory:', error)
      return { categories: [], products: [], totalOrders: 0 }
    }
  }

  async getUserPreferences(userId) {
    try {
      const user = await User.findById(userId)
      // Ici on pourrait analyser les préférences utilisateur
      // Pour l'instant, retourner un objet basique
      return {
        favoriteCategories: [],
        preferredPriceRange: { min: 0, max: 1000 }
      }
    } catch (error) {
      console.error('Erreur dans getUserPreferences:', error)
      return { favoriteCategories: [], preferredPriceRange: { min: 0, max: 1000 } }
    }
  }

  async getRecommendationsByCategories(categories, options = {}) {
    const { limit = 10, excludeProduct } = options

    try {
      const query = {
        category: { $in: categories },
        isActive: true
      }

      if (excludeProduct) {
        query._id = { $ne: excludeProduct }
      }

      return await Product.find(query)
        .populate('category')
        .sort({ 'rating.average': -1, createdAt: -1 })
        .limit(limit)
    } catch (error) {
      console.error('Erreur dans getRecommendationsByCategories:', error)
      return []
    }
  }

  async getPopularProducts(options = {}) {
    const { limit = 10, excludeProduct, excludeCategories = [] } = options

    try {
      const query = { isActive: true }

      if (excludeProduct) {
        query._id = { $ne: excludeProduct }
      }

      if (excludeCategories.length > 0) {
        query.category = { $nin: excludeCategories }
      }

      return await Product.find(query)
        .populate('category')
        .sort({ 'rating.average': -1, createdAt: -1 })
        .limit(limit)
    } catch (error) {
      console.error('Erreur dans getPopularProducts:', error)
      return []
    }
  }

  async getTopRatedProducts(options = {}) {
    const { limit = 10, excludeProduct } = options

    try {
      const query = {
        isActive: true,
        'rating.average': { $gte: 4.0 }
      }

      if (excludeProduct) {
        query._id = { $ne: excludeProduct }
      }

      return await Product.find(query)
        .populate('category')
        .sort({ 'rating.average': -1, 'rating.count': -1 })
        .limit(limit)
    } catch (error) {
      console.error('Erreur dans getTopRatedProducts:', error)
      return []
    }
  }

  generateSearchSuggestions(query) {
    if (!query || query.length < 2) return []

    const commonSuggestions = [
      'Montres',
      'Sacs à main',
      'Bijoux',
      'Lunettes de soleil',
      'Chaussures',
      'Colliers',
      'Bagues',
      'Boucles d\'oreilles',
      'Bracelets',
      'Montres de luxe'
    ]

    const queryLower = query.toLowerCase()

    return commonSuggestions
      .filter(suggestion =>
        suggestion.toLowerCase().includes(queryLower) ||
        queryLower.split(' ').some(term =>
          suggestion.toLowerCase().includes(term)
        )
      )
      .slice(0, aiConfig.search.maxSuggestions)
  }

  removeDuplicates(products) {
    const seen = new Set()
    return products.filter(product => {
      const id = product._id.toString()
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  }

  async getAIStatistics() {
    // Statistiques basiques pour le moment
    return {
      totalInteractions: 0,
      averageResponseTime: 0,
      popularQueries: [],
      recommendationAccuracy: 0
    }
  }
}

// Créer une instance unique du service
const aiService = new AIService()

// Nettoyer le cache toutes les heures
setInterval(() => {
  aiService.cleanCache()
}, 3600000)

module.exports = aiService
