import api from '../utils/api'

export const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData)
    return response.data
  },

  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params })
    return response.data
  },

  getMyOrders: async () => {
    const response = await api.get('/orders/my-orders')
    return response.data
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/my-orders/${id}`)
    return response.data
  },

  updateOrderStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status })
    return response.data
  },

  downloadOrderPDF: async (id) => {
    const response = await api.get(`/orders/${id}/pdf`, {
      responseType: 'blob'
    })
    return response.data
  },

  getOrderStats: async () => {
    const response = await api.get('/orders/stats')
    return response.data
  },
}
