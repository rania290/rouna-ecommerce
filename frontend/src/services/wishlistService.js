import api from '../utils/api'

export const wishlistService = {
  getWishlist: async () => {
    try {
      const response = await api.get('/wishlist')
      return response.data?.data || []
    } catch (error) {
      console.error('Erreur lors de la récupération de la wishlist:', error)
      if (error.response?.status === 401) {
        // Rediriger vers la page de connexion si non authentifié
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      }
      return []
    }
  },

  addToWishlist: async (productId) => {
    try {
console.log('Tentative d\'ajout à la wishlist, produit ID:', productId)
      console.log('URL de la requête complète:', api.defaults.baseURL + '/wishlist')
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Authorization': api.defaults.headers.common['Authorization'] ? 'Bearer [token]' : 'Non défini'
      })
      
      const response = await api.post('/wishlist', { productId })
      console.log('Réponse du serveur:', response.data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la wishlist:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      })
      throw error
    }
  },

  removeFromWishlist: async (wishlistItemId) => {
    try {
      const response = await api.delete(`/wishlist/${wishlistItemId}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la suppression de la wishlist:', error)
      throw error
    }
  },

  isInWishlist: async (productId) => {
    try {
      const response = await api.get(`/wishlist/check/${productId}`)
      return response.data?.inWishlist || false
    } catch (error) {
      console.error('Erreur lors de la vérification de la wishlist:', error)
      return false
    }
  },
}

