import { useState, useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { aiService } from '../../services/aiService'
import ProductGrid from './ProductGrid'
import { Loader } from 'lucide-react'

const AIRecommendations = ({ userId, productId = null }) => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const cacheRef = useRef({})

  useEffect(() => {
    // Only load once per user session to prevent excessive API calls
    const cacheKey = `${userId}-${productId || 'general'}`
    if (cacheRef.current[cacheKey] && hasLoaded) {
      setRecommendations(cacheRef.current[cacheKey])
      setLoading(false)
      return
    }

    loadRecommendations()
  }, [userId, productId, hasLoaded])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      const data = await aiService.getRecommendations(userId, productId)
      const safeData = Array.isArray(data) ? data : []
      setRecommendations(safeData)

      // Cache the results
      const cacheKey = `${userId}-${productId || 'general'}`
      cacheRef.current[cacheKey] = safeData
      setHasLoaded(true)
    } catch (error) {
      // Commented out console.error to prevent memory accumulation
      // console.error('Erreur lors du chargement des recommandations:', error)
      setRecommendations([])
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

  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-gradient-to-b from-white to-secondary-50">
      <div className="container-custom">
        <div className="flex items-center space-x-2 mb-8">
          <Sparkles className="w-6 h-6 text-primary-600" />
          <h2 className="text-3xl font-bold text-secondary-900">
            Recommandations IA pour vous
          </h2>
        </div>
        <ProductGrid products={recommendations.slice(0, 8)} loading={false} />
      </div>
    </section>
  )
}

export default AIRecommendations
