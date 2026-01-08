import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWishlist } from '../contexts/WishlistContext'
import { useAuth } from '../contexts/AuthContext'
import ProductGrid from '../components/Product/ProductGrid'
import { Heart, Loader, ArrowLeft, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const Wishlist = () => {
  const {
    wishlistItems,
    loading,
    error,
    isAuthenticated,
    removeFromWishlist
  } = useWishlist()

  const { user } = useAuth()
  const navigate = useNavigate()

  // Rediriger les utilisateurs non connectés ou administrateurs
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [user, navigate, isAuthenticated, loading])

  // Afficher le chargement
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-20">
        <Loader className="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <p className="text-secondary-600">Chargement de votre wishlist...</p>
      </div>
    )
  }

  // Gérer les erreurs
  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-20 px-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          Oups, une erreur est survenue
        </h2>
        <p className="text-secondary-600 mb-6 max-w-md">
          Nous n'avons pas pu charger votre wishlist. Veuillez réessayer plus tard.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Réessayer
        </button>
      </div>
    )
  }

  // Extraire les produits de la wishlist
  const products = wishlistItems
    .map((item) => item.product || item)
    .filter(Boolean)
    .filter(product => product && product._id) // S'assurer que les produits sont valides

  // Afficher la wishlist vide
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[50vh] flex flex-col items-center justify-center py-20 px-4 text-center"
      >
        <Heart className="w-20 h-20 text-secondary-200 mb-6" strokeWidth={1} />
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          Votre wishlist est vide
        </h2>
        <p className="text-secondary-600 mb-8 max-w-md">
          {isAuthenticated
            ? "Ajoutez des produits à votre wishlist pour les retrouver facilement plus tard."
            : "Connectez-vous pour ajouter des produits à votre wishlist et les retrouver facilement."
          }
        </p>

        {isAuthenticated ? (
          <Link to="/products" className="btn btn-primary">
            Découvrir nos produits
          </Link>
        ) : (
          <Link
            to="/login"
            state={{ from: '/wishlist' }}
            className="btn btn-primary"
          >
            Se connecter
          </Link>
        )}
      </motion.div>
    )
  }

  // Afficher la wishlist avec les produits
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-8 md:py-12"
    >
      <div className="container-custom">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-primary-600 hover:text-primary-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900">
            Ma wishlist
          </h1>
          <p className="text-secondary-500 mt-2">
            {products.length} {products.length > 1 ? 'articles' : 'article'} dans votre wishlist
          </p>
        </div>

        <ProductGrid
          products={products}
          loading={false}
          onRemoveFromWishlist={removeFromWishlist}
        />
      </div>
    </motion.div>
  )
}

export default Wishlist

