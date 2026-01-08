import api from '../utils/api'

export const reviewService = {
  getProductReviews: async (productId) => {
    const response = await api.get(`/reviews/product/${productId}`)
    return response.data
  },

  createReview: async (reviewData) => {
    try {
      console.log('Envoi des données d\'avis:', reviewData);
      const response = await api.post('/reviews', reviewData);
      console.log('Réponse de l\'API (createReview):', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'avis:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      throw error; // Propager l'erreur pour une gestion plus poussée
    }
  },

  updateReview: async (id, reviewData) => {
    const response = await api.put(`/reviews/${id}`, reviewData)
    return response.data
  },

  deleteReview: async (id) => {
    const response = await api.delete(`/reviews/${id}`)
    return response.data
  },
}

