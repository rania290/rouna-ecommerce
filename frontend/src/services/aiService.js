import api from '../utils/api'

// Service pour l'intégration IA
export const aiService = {
  // Recommandations de produits basées sur l'IA
  getRecommendations: async (userId, productId = null) => {
    try {
      // Utiliser l'API IA du backend si l'utilisateur est connecté
      if (userId) {
        const response = await api.get(`/ai/recommendations/user/${userId}`, {
          params: productId ? { productId } : {}
        })
        return response.data.data || []
      } else {
        // Fallback vers les produits populaires pour les utilisateurs non connectés
        const response = await api.get('/products/popular', {
          params: { limit: 8 }
        })
        return response.data.data || []
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error)
      // Fallback vers les produits populaires
      try {
        const response = await api.get('/products/popular', {
          params: { limit: 8 }
        })
        return response.data.data || []
      } catch (fallbackError) {
        console.error('Erreur du fallback:', fallbackError)
        return []
      }
    }
  },

  // Recherche intelligente avec IA
  intelligentSearch: async (query, filters = {}) => {
    try {
      // Utiliser l'API IA de recherche intelligente
      const response = await api.get('/ai/search', {
        params: {
          query: query,
          limit: 5, // Limiter le nombre de résultats pour la recherche en temps réel
          ...filters,
        },
      })

      // La réponse contient déjà les produits et suggestions
      const data = response.data.data || {}
      return {
        products: Array.isArray(data.products) ? data.products : [],
        aiSuggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        query: data.query,
        totalResults: data.totalResults || 0
      }
    } catch (error) {
      console.error('Erreur lors de la recherche intelligente:', error)
      // Fallback vers la recherche classique
      try {
        const response = await api.get('/products', {
          params: {
            search: query,
            limit: 5,
            ...filters,
          },
        })

        const products = response.data.data || response.data.products || [];
        const suggestions = generateAISuggestions(query)

        return {
          products: Array.isArray(products) ? products : [],
          aiSuggestions: Array.isArray(suggestions) ? suggestions : [],
        }
      } catch (fallbackError) {
        console.error('Erreur du fallback de recherche:', fallbackError)
        return { products: [], aiSuggestions: [] }
      }
    }
  },

  // Analyse de style et recommandations
  getStyleRecommendations: async (productId) => {
    try {
      // Utiliser l'API IA des recommandations de produits similaires
      const response = await api.get(`/ai/recommendations/product/${productId}`)
      return {
        success: true,
        products: response.data.data || []
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations de style:', error)
      // Fallback vers les produits liés classiques
      try {
        const response = await api.get(`/products/related/${productId}`)
        return response.data
      } catch (fallbackError) {
        console.error('Erreur du fallback des recommandations de style:', fallbackError)
        return { products: [] }
      }
    }
  },

  // Chatbot pour assistance
  chatWithAI: async (message, context = {}) => {
    try {
      // Utiliser l'API IA du chatbot
      const response = await api.post('/ai/chat', {
        message: message.trim(),
        context
      })

      const data = response.data.data || {}
      return {
        message: data.message || 'Désolé, je n\'ai pas pu traiter votre demande.',
        suggestions: data.suggestions || [],
        timestamp: data.timestamp
      }
    } catch (error) {
      console.error('Erreur lors du chat avec l\'IA:', error)
      // Fallback vers la logique locale si l'API IA échoue
      return getLocalChatbotResponse(message, context)
    }
  },
}

// Fonction helper pour générer des suggestions IA
function generateAISuggestions(query) {
  if (!query || query.length < 2) return [];

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
  ];

  // Si la requête est très courte, on renvoie des suggestions génériques
  if (query.length < 3) {
    return commonSuggestions.slice(0, 3);
  }

  // Filtre les suggestions basées sur la similarité avec la requête
  const queryLower = query.toLowerCase();

  return commonSuggestions
    .filter(suggestion =>
      suggestion.toLowerCase().includes(queryLower) ||
      queryLower.split(' ').some(term =>
        suggestion.toLowerCase().includes(term)
      )
    )
    .slice(0, 4);
}

// Fonction de fallback pour le chatbot en cas d'erreur API
function getLocalChatbotResponse(message, context = {}) {
  const lowerMessage = message.toLowerCase().trim()

  // Réponses contextuelles basées sur le contenu du message
  let response = ''
  let suggestions = []

  // Salutations
  if (/(bonjour|salut|coucou|hello|hi|hey)/i.test(lowerMessage)) {
    response = 'Bonjour ! Je suis votre assistant Rouna. Comment puis-je vous aider aujourd\'hui ?'
    suggestions = ['Voir les produits', 'Suivre ma commande', 'Contacter le support']
  }
  // Produits
  else if (/(produit|article|modèle|modifier|changer|taille|couleur)/i.test(lowerMessage)) {
    response = 'Je peux vous aider à trouver le produit parfait. Que recherchez-vous exactement ? Par exemple : "Montre en or" ou "Bague en argent".'
    suggestions = ['Montres pour femme', 'Bagues en or', 'Colliers élégants']
  }
  // Commandes
  else if (/(commande|livraison|suivi|colis|expédition)/i.test(lowerMessage)) {
    response = 'Pour suivre votre commande, j\'aurai besoin de votre numéro de commande. Je peux également vous aider à passer une nouvelle commande.'
    suggestions = ['Suivre ma commande', 'Voir mon historique', 'Contacter le service client']
  }
  // Paiement
  else if (/(paiement|payer|cb|carte|paypal|virement)/i.test(lowerMessage)) {
    response = 'Nous acceptons les paiements par carte bancaire, PayPal et virement. Toutes les transactions sont sécurisées.'
    suggestions = ['Méthodes de paiement', 'Paiement sécurisé', 'Problème de paiement']
  }
  // Retours et échanges
  else if (/(retour|échange|remboursement|défectueux|cassé)/i.test(lowerMessage)) {
    response = 'Vous avez 30 jours pour retourner un article non porté et non personnalisé. Le remboursement est effectué sous 14 jours. Avez-vous besoin d\'aide pour initier un retour ?'
    suggestions = ['Démarrer un retour', 'Conditions de retour', 'Contacter le SAV']
  }
  // Contact
  else if (/(contact|email|téléphone|appeler|parler à quelqu'un)/i.test(lowerMessage)) {
    response = 'Vous pouvez nous contacter par email à contact@rouna.com ou par téléphone au 01 23 45 67 89 du lundi au vendredi de 9h à 18h. Notre équipe se fera un plaisir de vous aider !'
    suggestions = ['Nous appeler', 'Envoyer un email', 'FAQ']
  }
  // Remerciements
  else if (/(merci|parfait|super|génial|parfait|ok|d'accord)/i.test(lowerMessage)) {
    response = 'Avec plaisir ! Y a-t-il autre chose dont vous avez besoin ? Je suis là pour vous aider.'
    suggestions = ['Voir les nouveautés', 'Suivre ma commande', 'Voir mon panier']
  }
  // Par défaut
  else {
    response = 'Je ne suis pas sûr de bien comprendre. Pouvez-vous reformuler votre demande ? Je peux vous aider avec les produits, les commandes, les retours et plus encore.'
    suggestions = ['Voir la collection', 'Comment commander', 'Nous contacter']
  }

  // Si la réponse est une question, on ajoute un point d'interrogation
  if (!/[.?!;:]$/.test(response)) {
    response += ' ?'
  }

  return {
    message: response,
    suggestions: suggestions,
    timestamp: new Date().toISOString()
  }
}
