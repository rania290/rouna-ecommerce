import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Sparkles, Loader } from 'lucide-react'
import { aiService } from '../../services/aiService'
import { productService } from '../../services/productService'
import { motion, AnimatePresence } from 'framer-motion'

const AISearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (query.length > 2) {
      const timeoutId = setTimeout(() => {
        handleSearch()
      }, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setResults([])
      setSuggestions([])
    }
  }, [query])

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([])
      setSuggestions([])
      return
    }

    setIsSearching(true)
    setLoading(true)

    try {
      const data = await aiService.intelligentSearch(query)
      
      // Vérifier que les données sont dans le bon format
      const products = Array.isArray(data.products) ? data.products : []
      const aiSuggestions = Array.isArray(data.aiSuggestions) ? data.aiSuggestions : []
      
      setResults(products)
      setSuggestions(aiSuggestions)
      
      // Débogage
      console.log('Résultats de la recherche:', { products, aiSuggestions })
      
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      setResults([])
      setSuggestions([])
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  const handleProductClick = (product) => {
    navigate(`/products/slug/${product.slug}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl mx-auto mt-20 overflow-hidden"
        >
          {/* Search Input */}
          <div className="p-4 border-b border-secondary-200">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher avec l'IA..."
                  className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {isSearching && (
                  <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-primary-600" />
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="p-8 text-center">
                <Loader className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-2" />
                <p className="text-secondary-600">Recherche en cours...</p>
              </div>
            )}

            {!loading && query.length > 2 && results.length === 0 && (
              <div className="p-8 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-secondary-400 mb-2" />
                <p className="text-secondary-600">
                  Aucun résultat trouvé pour "{query}". Essayez avec d'autres termes.
                </p>
                {suggestions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-secondary-500 mb-2">Suggestions :</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setQuery(suggestion)}
                          className="px-3 py-1 text-sm bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && suggestions.length > 0 && (
              <div className="p-4 border-b border-secondary-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-semibold text-secondary-700">
                    Suggestions IA
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(suggestion)}
                      className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="p-4">
                <p className="text-sm font-semibold text-secondary-700 mb-3">
                  {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {results.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => handleProductClick(product)}
                      className="w-full flex items-center space-x-4 p-3 hover:bg-secondary-50 rounded-lg transition-colors text-left"
                    >
                      <img
                        src={
                          product.images?.[0]?.url ||
                          `http://localhost:5000/uploads/${product.images?.[0]?.url}` ||
                          '/placeholder.jpg'
                        }
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-secondary-900">
                          {product.name}
                        </h4>
                        <p className="text-sm text-secondary-600">
                          {product.shortDescription || product.description?.substring(0, 50)}...
                        </p>
                        <p className="text-primary-600 font-semibold mt-1">
                          {product.salePrice
                            ? `${product.salePrice.toFixed(2)} DT`
                            : `${product.price.toFixed(2)} DT`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.length <= 2 && (
              <div className="p-8 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-primary-600 mb-2" />
                <p className="text-secondary-600">
                  Commencez à taper pour rechercher avec l'IA
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AISearch
