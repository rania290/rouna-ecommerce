import api from '../utils/api'

export const productService = {
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params })
    return response.data
  },

  getAdminProducts: async (params = {}) => {
    const response = await api.get('/products/admin/all', { params })
    return response.data
  },

  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },

  getProductBySlug: async (slug) => {
    const response = await api.get(`/products/slug/${slug}`)
    return response.data
  },

  getPopularProducts: async () => {
    const response = await api.get('/products/popular')
    return response.data
  },

  getSaleProducts: async () => {
    const response = await api.get('/products/sale')
    return response.data
  },

  getRelatedProducts: async (id) => {
    const response = await api.get(`/products/related/${id}`)
    return response.data
  },

  searchProducts: async (query) => {
    const response = await api.get('/products', {
      params: { search: query },
    })
    return response.data
  },

  createProduct: async (productData) => {
    // Vérifier si c'est un FormData pour configurer les en-têtes appropriés
    const config = {}
    if (productData instanceof FormData) {
      config.headers = {
        'Content-Type': 'multipart/form-data'
      }
    }
    const response = await api.post('/products', productData, config)
    return response.data
  },

  updateProduct: async (id, productData) => {
    // Vérifier si c'est un FormData pour configurer les en-têtes appropriés
    const config = {}
    if (productData instanceof FormData) {
      config.headers = {
        'Content-Type': 'multipart/form-data'
      }
    }
    const response = await api.put(`/products/${id}`, productData, config)
    return response.data
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  },
}
