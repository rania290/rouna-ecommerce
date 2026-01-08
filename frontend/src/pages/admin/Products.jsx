import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { productService } from '../../services/productService'
import ProductGrid from '../../components/Product/ProductGrid'
import { Plus, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminProducts = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/')
    }
    loadProducts()
  }, [user, navigate])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.getAdminProducts({ limit: 100 })
      setProducts(data.products || data.docs || data.data || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    navigate(`/admin/products/edit/${product._id}`)
  }

  const handleDelete = async (product) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
      try {
        await productService.deleteProduct(product._id)
        toast.success('Produit supprimé avec succès')
        loadProducts() // Recharger la liste
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        toast.error('Erreur lors de la suppression du produit')
      }
    }
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-secondary-900">
            Gestion des bijoux
          </h1>
          <button
            onClick={() => navigate('/admin/products/new')}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter un produit</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <ProductGrid
            products={products}
            loading={false}
            isAdmin={user?.role === 'admin'}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}

export default AdminProducts

