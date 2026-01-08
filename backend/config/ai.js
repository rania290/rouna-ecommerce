
const aiConfig = {
  
  enabled: process.env.AI_ENABLED !== 'false',

  // Configuration du chatbot
  chatbot: {
    maxContextLength: 10, 
    maxResponseLength: 500, 
    temperature: 0.7, 
    model: process.env.AI_MODEL || 'gpt-3.5-turbo'
  },

  // Configuration des recommandations
  recommendations: {
    maxRecommendations: 20, 
    similarityThreshold: 0.3, 
    userHistoryWeight: 0.6, 
    categoryWeight: 0.3,
    ratingWeight: 0.1 
  },

  // Configuration de la recherche intelligente
  search: {
    fuzzyThreshold: 0.8, 
    maxSuggestions: 5, 
    semanticSearchEnabled: true
  },

 

  // Cache IA
  cache: {
    enabled: true,
    ttl: 3600, // TTL en secondes (1 heure)
    maxSize: 1000 // Nombre maximum d'entrées en cache
  },

  // Logging et analytics
  logging: {
    enabled: process.env.NODE_ENV === 'production',
    logLevel: process.env.AI_LOG_LEVEL || 'info',
    trackInteractions: true
  }
}

module.exports = aiConfig
