import { useState, useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { orderService } from '../services/orderService'
import { Package, Loader, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Orders = () => {
  const { user, isAuthenticated } = useAuth()
  const { id } = useParams()
  const [orders, setOrders] = useState([])
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  useEffect(() => {
    if (id) {
      loadOrderDetail(id)
    } else {
      loadOrders()
    }
  }, [id])

  const loadOrderDetail = async (orderId) => {
    try {
      setLoading(true)
      const data = await orderService.getOrderById(orderId)
      setOrder(data.data || data)
    } catch (error) {
      console.error('Erreur lors du chargement de la commande:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await orderService.getMyOrders()
      setOrders(data.data?.docs || data.docs || data.data || data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-secondary-100 text-secondary-800'
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'En attente',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    }
    return texts[status] || status
  }



  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (order) {
    return (
      <div className="py-8">
        <div className="container-custom">
          <Link to="/orders" className="flex items-center text-primary-600 hover:text-primary-700 mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour aux commandes
          </Link>
          <h1 className="text-3xl font-bold text-secondary-900 mb-8">
            Détails de la commande #{order.orderNumber || order._id.slice(-8)}
          </h1>
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Informations de commande</h3>
                <p><strong>Numéro:</strong> {order.orderNumber || order._id}</p>
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                <p><strong>Statut:</strong> <span className={`px-2 py-1 rounded text-sm ${getStatusColor(order.orderStatus || order.status)}`}>{getStatusText(order.orderStatus || order.status)}</span></p>
                <p><strong>Total:</strong> {order.total?.toFixed(2)} DT</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Adresse de livraison</h3>
                {order.shippingAddress ? (
                  <div>
                    <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    <p>{order.shippingAddress.street}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p>Adresse non disponible</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Bijoux commandés</h3>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 border-b border-secondary-200 pb-4">
                    <img
                      src={
                        item.product?.images?.[0]?.url?.startsWith('http')
                          ? item.product.images[0].url
                          : `http://localhost:5000/uploads/${item.product?.images?.[0]?.url || 'placeholder.jpg'}`
                      }
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product?.name}</h4>
                      <p className="text-sm text-secondary-600">Quantité: {item.quantity}</p>
                      <p className="text-sm text-secondary-600">Prix: {item.price?.toFixed(2)} DT</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{(item.quantity * item.price)?.toFixed(2)} DT</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="py-20">
        <div className="container-custom text-center">
          <Package className="w-24 h-24 mx-auto text-secondary-300 mb-6" />
          <h2 className="text-3xl font-bold text-secondary-900 mb-4">
            Aucune commande
          </h2>
          <p className="text-secondary-600 mb-8">
            Vous n'avez pas encore passé de commande
          </p>
          <Link to="/products" className="btn btn-primary">
            Explorer les bijoux
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <h1 className="text-4xl font-bold text-secondary-900 mb-8">
          Mes commandes
        </h1>

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="card p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Commande #{order.orderNumber || order._id.slice(-8)}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                  <span className="text-lg font-bold">
                    {order.total.toFixed(2)} DT
                  </span>
                </div>
              </div>

              <div className="border-t border-secondary-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {order.items?.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <img
                        src={
                          item.product?.images?.[0]?.url?.startsWith('http')
                            ? item.product.images[0].url
                            : `http://localhost:5000/uploads/${item.product?.images?.[0]?.url || 'placeholder.jpg'}`
                        }
                        alt={item.product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium text-sm">{item.product?.name}</p>
                        <p className="text-sm text-secondary-600">
                          Qté: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {order.items?.length > 3 && (
                  <p className="text-sm text-secondary-600">
                    +{order.items.length - 3} autre(s) produit(s)
                  </p>
                )}
              </div>

              <Link
                to={`/orders/${order._id}`}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm mt-4 inline-block"
              >
                Voir les détails →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Orders
