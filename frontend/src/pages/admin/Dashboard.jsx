import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { orderService } from '../../services/orderService'
import { BarChart3, Package, ShoppingCart, Users, Loader } from 'lucide-react'

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [statsData, setStatsData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/')
    } else {
      loadStats()
    }
  }, [user, navigate])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await orderService.getOrderStats()
      if (response.success) {
        setStatsData(response.data)
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin') {
    return null
  }

  const stats = [
    {
      label: 'Bijoux Total',
      value: statsData?.totalProducts || '0',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      label: 'Commandes (Mois)',
      value: statsData?.monthOrders || '0',
      icon: ShoppingCart,
      color: 'bg-green-500'
    },
    {
      label: 'Utilisateurs',
      value: statsData?.totalUsers || '0',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      label: 'Revenus (Mois)',
      value: `${(statsData?.monthRevenue || 0).toFixed(2)} DT`,
      icon: BarChart3,
      color: 'bg-primary-600'
    },
  ]

  return (
    <div className="py-8">
      <div className="container-custom">
        <h1 className="text-4xl font-bold text-secondary-900 mb-8">
          Tableau de bord
        </h1>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary-600 text-sm mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Actions rapides</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/products')}
                className="btn btn-primary w-full text-left"
              >
                Gérer les bijoux
              </button>
              <button
                onClick={() => navigate('/admin/orders')}
                className="btn btn-outline w-full text-left"
              >
                Gérer les commandes
              </button>
              <button
                onClick={() => navigate('/admin/categories')}
                className="btn btn-outline w-full text-left"
              >
                Gérer les catégories
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Informations</h2>
            <p className="text-secondary-600">
              Bienvenue dans le panneau d'administration de Rouna.
              Utilisez le menu pour gérer vos bijoux, commandes et catégories.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

