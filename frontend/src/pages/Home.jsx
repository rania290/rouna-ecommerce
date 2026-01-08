import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import ProductGrid from '../components/Product/ProductGrid'
import AIRecommendations from '../components/Product/AIRecommendations'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [saleProducts, setSaleProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [featured, sale, cats] = await Promise.all([
        productService.getProducts({ isFeatured: true, limit: 8 }),
        productService.getSaleProducts(),
        categoryService.getCategories(),
      ])
      setFeaturedProducts(featured.data || featured.products || featured || [])
      setSaleProducts(sale.data || sale.products || sale || [])
      setCategories(cats.categories || cats.data || cats || [])
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Découvrez l'Élégance
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Collection exclusive d'accessoires de mode pour votre style unique.
              Propulsé par l'intelligence artificielle.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/products"
                className="btn bg-white text-primary-600 hover:bg-secondary-100 px-8 py-4 text-lg"
              >
                Explorer la collection
                <ArrowRight className="ml-2 w-5 h-5 inline" />
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
      </section>



      {/* Featured Products */}
      <section className="py-12 bg-secondary-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-secondary-900">
              Bijoux en vedette
            </h2>
            <Link
              to="/products?featured=true"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-2"
            >
              <span>Voir tout</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <ProductGrid products={featuredProducts} loading={loading} />
        </div>
      </section>



      {/* AI Recommendations */}
      {user && (
        <AIRecommendations userId={user._id} />
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">
              Découvrez votre style avec l'IA
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Notre assistant IA vous aide à trouver les accessoires parfaits
              pour votre style unique.
            </p>
            <Link
              to="/products"
              className="btn bg-white text-primary-600 hover:bg-secondary-100 px-8 py-4 text-lg inline-flex items-center"
            >
              Commencer maintenant
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home
