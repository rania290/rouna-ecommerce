import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { categoryService } from '../services/categoryService'
import { productService } from '../services/productService'
import ProductGrid from '../components/Product/ProductGrid'
import { Loader } from 'lucide-react'

const Category = () => {
  const { slug } = useParams()
  const [category, setCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategory()
  }, [slug])

  const loadCategory = async () => {
    try {
      setLoading(true)
      const categoryData = await categoryService.getCategoryBySlug(slug)
      const payload = categoryData.data || categoryData
      const currentCategory = payload.category || payload
      const productsFromSlug = payload.products || []

      // Si la route slug ne renvoie pas les produits, on requête par ID
      const productsData =
        productsFromSlug.length > 0
          ? { data: productsFromSlug }
          : await productService.getProducts({ category: currentCategory?._id })

      setCategory(currentCategory)
      setProducts(
        productsData.data?.docs ||
          productsData.data?.products ||
          productsData.data ||
          productsFromSlug ||
          []
      )
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="text-center py-20">
        <p className="text-secondary-600 text-lg">Catégorie non trouvée</p>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-secondary-900 mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-secondary-600 text-lg max-w-3xl">
              {category.description}
            </p>
          )}
        </div>

        <ProductGrid products={products} loading={loading} />
      </div>
    </div>
  )
}

export default Category

