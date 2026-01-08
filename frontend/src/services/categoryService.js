import api from '../utils/api'

export const categoryService = {
  getCategories: async () => {
    try {
      const response = await api.get('/categories')
      // Vérifier si la réponse indique une erreur
      if (!response.data.success) {
        throw new Error('API returned error')
      }
      return response.data
    } catch (error) {
      console.log('API catégories indisponible, utilisation de données mockées')
      // Retourner des catégories mockées
      return {
        success: true,
        categories: [
          {
            _id: '507f1f77bcf86cd799439012',
            name: 'Colliers',
            slug: 'colliers',
            description: 'Sélection de colliers élégants',
            isActive: true,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'
          },
          {
            _id: '507f1f77bcf86cd799439014',
            name: 'Bagues',
            slug: 'bagues',
            description: 'Bagues raffinées et modernes',
            isActive: true,
            image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'
          },
          {
            _id: '507f1f77bcf86cd799439016',
            name: 'Gourmettes',
            slug: 'gourmettes',
            description: 'Gourmettes et bracelets de caractère',
            isActive: true,
            image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1200&q=80'
          },
          {
            _id: '507f1f77bcf86cd799439018',
            name: 'Bracelets',
            slug: 'bracelets',
            description: 'Bracelets élégants pour tous les styles',
            isActive: true,
            image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1200&q=80'
          }
        ]
      }
    }
  },

  getCategoryBySlug: async (slug) => {
    try {
      const response = await api.get(`/categories/slug/${slug}`)
      return response.data
    } catch (error) {
      console.log(`API catégorie ${slug} indisponible, utilisation de données mockées`)
      // Retourner la catégorie mockée correspondante
      const mockCategories = [
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Colliers',
          slug: 'colliers',
          description: 'Sélection de colliers élégants',
          isActive: true
        },
        {
          _id: '507f1f77bcf86cd799439014',
          name: 'Bagues',
          slug: 'bagues',
          description: 'Bagues raffinées et modernes',
          isActive: true
        },
        {
          _id: '507f1f77bcf86cd799439016',
          name: 'Gourmettes',
          slug: 'gourmettes',
          description: 'Gourmettes et bracelets de caractère',
          isActive: true
        },
        {
          _id: '507f1f77bcf86cd799439018',
          name: 'Bracelets',
          slug: 'bracelets',
          description: 'Bracelets élégants pour tous les styles',
          isActive: true
        }
      ]

      const category = mockCategories.find(cat => cat.slug === slug)
      if (category) {
        return {
          success: true,
          category: category
        }
      }
      throw error // Re-throw if not found
    }
  },

  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`)
    return response.data
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData)
    return response.data
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData)
    return response.data
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  },
}
