import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Edit, Trash2 } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'

const ProductCard = ({ product, isAdmin = false, onEdit, onDelete }) => {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()

  const mainImage =
    product.images?.find((img) => img.isMain)?.url ||
    product.images?.[0]?.url ||
    ''

  // Construction de l'URL de l'image avec gestion améliorée
  let imageUrl = ''
  if (mainImage) {
    if (mainImage.startsWith('http://') || mainImage.startsWith('https://')) {
      // URL complète
      imageUrl = mainImage
    } else if (mainImage.startsWith('/uploads/')) {
      // Pour les chemins uploads, utiliser le proxy Vite
      imageUrl = mainImage
    } else if (mainImage.startsWith('images/')) {
      // Pour les images statiques dans le dossier public
      imageUrl = `/${mainImage}`
    } else {
      // Pour les autres cas, essayer avec le chemin direct
      imageUrl = mainImage
    }
  }

  const fallbackUrl = 'https://via.placeholder.com/600x600?text=Image+indisponible'
  const displayImage = imageUrl || fallbackUrl

  // Debug: afficher l'URL construite (commented out to prevent memory issues)
  // console.log(`🖼️ Produit "${product.name}":`, {
  //   mainImage,
  //   imageUrl,
  //   displayImage
  // });

  const handleImageError = (e) => {
    // Commented out console.log to prevent memory accumulation
    // console.log('❌ Erreur de chargement d\'image:', {
    //   produit: product.name,
    //   urlEssayee: e.target.src,
    //   urlOriginale: mainImage,
    //   urlConstruite: imageUrl
    // });
    // Fallback si l'image distante est bloquée ou absente
    e.target.src = 'https://via.placeholder.com/600x600?text=Image+indisponible'
  }

  const price = product.salePrice || product.price
  const originalPrice = product.salePrice ? product.price : null

  const navigate = useNavigate() // Make sure to add this hook call
  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    addToCart(product, 1)
  }

  const handleWishlistToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    toggleWishlist(product._id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="card group"
    >
      <Link to={`/products/slug/${product.slug}`}>
        <div className="relative overflow-hidden">
          <img
            src={displayImage}
            alt={product.name}
            onError={handleImageError}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {product.isOnSale && (
            <span className="absolute top-3 left-3 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              -{product.salePercentage || Math.round(((product.price - price) / product.price) * 100)}%
            </span>
          )}
          {product.isNewProduct && (
            <span className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Nouveau
            </span>
          )}
          <div className="absolute top-3 right-3 flex flex-col space-y-2">
            {!isAdmin && (
              <>
                <button
                  onClick={handleWishlistToggle}
                  className={`p-2 rounded-full shadow-lg transition-colors ${isInWishlist(product._id)
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-secondary-700 hover:bg-primary-600 hover:text-white'
                    }`}
                >
                  <Heart className="w-4 h-4" fill={isInWishlist(product._id) ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={handleAddToCart}
                  className="p-2 bg-white text-secondary-700 rounded-full shadow-lg hover:bg-primary-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-secondary-900 mb-1 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
            {product.shortDescription || product.description}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-primary-600">
                {price.toFixed(2)} DT
              </span>
              {originalPrice && (
                <span className="ml-2 text-sm text-secondary-500 line-through">
                  {originalPrice.toFixed(2)} DT
                </span>
              )}
            </div>
            {product.rating?.average > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm text-secondary-600">
                  {product.rating.average.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default ProductCard
