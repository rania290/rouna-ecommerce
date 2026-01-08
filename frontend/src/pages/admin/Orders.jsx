import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { orderService } from '../../services/orderService'
import { Loader } from 'lucide-react'

const AdminOrders = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/')
    }
    loadOrders()
  }, [user, navigate])

  const loadOrders = async (userId = null) => {
    try {
      setLoading(true)
      const params = {}
      if (userId) {
        params.userId = userId
      }
      const data = await orderService.getOrders(params)
      setOrders(data.data?.docs || data.docs || data.data || data || [])

      if (userId) {
        // Find the user object from the first order if possible, or we could fetch user details separately
        // But looking at the list is easier if it's not empty
        const foundOrder = (data.data?.docs || data.docs || data.data || data || []).find(o => o.user?._id === userId || o.user === userId);
        if (foundOrder && foundOrder.user && typeof foundOrder.user === 'object') {
          setSelectedUser(foundOrder.user);
        }
      } else {
        setSelectedUser(null)
      }

    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserFilter = (userData) => {
    setSelectedUser(userData)
    loadOrders(userData._id)
  }

  const clearFilter = () => {
    setSelectedUser(null)
    loadOrders()
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-secondary-900">
              {selectedUser
                ? `Historique : ${selectedUser.username || 'Client'}`
                : 'Gestion des commandes'}
            </h1>
            {selectedUser && (
              <button
                onClick={clearFilter}
                className="text-primary-600 hover:underline text-sm mt-2"
              >
                ← Voir toutes les commandes
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-10 text-gray-500">Aucune commande trouvée.</div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          Commande #{order.orderNumber || order._id.slice(-8)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                          }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-secondary-600 space-x-4">
                        <span>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
                        <span>•</span>
                        <span>{order.total?.toFixed(2)} DT</span>
                        <span>•</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (order.user) handleUserFilter(order.user);
                          }}
                          className="text-primary-600 hover:underline font-medium flex items-center gap-1"
                          title="Voir l'historique de ce client"
                        >
                          Client : {order.user?.username || 'Anonyme'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Actions futures ici if needed */}
                    </div>
                  </div>
                </div>
              )))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminOrders

