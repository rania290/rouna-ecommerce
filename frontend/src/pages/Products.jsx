import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import { useAuth } from '../contexts/AuthContext'
import ProductGrid from '../components/Product/ProductGrid'

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: 1,
    limit: 12,
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [searchParams])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const params = {
        ...filters,
        category: searchParams.get('category') || filters.category,
        search: searchParams.get('search') || filters.search,
      }
      const data = await productService.getProducts(params)
      const payload = data.data || data
      setProducts(
        payload?.docs ||
        payload?.products ||
        payload ||
        []
      )
    } catch (error) {
      console.error('Erreur lors du chargement des bijoux:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories()
      const list = data.data || data.categories || data || []
      const filtered = list.filter(
        (cat) => !/montre|sac|bijoux|jewelry/i.test(cat.name)
      )
      setCategories(filtered)
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error)
    }
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 }
    setFilters(newFilters)
    setSearchParams({ ...newFilters })
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-secondary-900 mb-2">
            Tous les bijoux
          </h1>
          <p className="text-secondary-600">
            {products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside
            className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'
              }`}
          >
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Filtres</h2>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Catégories</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={filters.category === ''}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="text-primary-600"
                    />
                    <span>Toutes</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat._id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="category"
                        value={cat._id}
                        checked={filters.category === cat._id}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="text-primary-600"
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Prix</h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="input"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="font-semibold mb-3">Trier par</h3>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="input"
                >
                  <option value="newest">Plus récent</option>
                  <option value="oldest">Plus ancien</option>
                  <option value="price-low">Prix croissant</option>
                  <option value="price-high">Prix décroissant</option>
                  <option value="rating">Meilleure note</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden btn btn-secondary flex items-center space-x-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filtres</span>
              </button>
            </div>
            <ProductGrid
              products={products}
              loading={loading}
              isAdmin={user?.role === 'admin'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products

