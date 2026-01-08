import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { wishlistService } from '../services/wishlistService'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const WishlistContext = createContext()

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await wishlistService.getWishlist()
      setWishlistItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur lors du chargement de la wishlist:', error)
      setError('Impossible de charger la wishlist')
      
      // Rediriger vers la page de connexion si non authentifié
      if (error.response?.status === 401) {
        navigate('/login', { state: { from: window.location.pathname } })
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  const addToWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour ajouter à la wishlist')
      navigate('/login', { state: { from: window.location.pathname } })
      return false
    }

    try {
      await wishlistService.addToWishlist(productId)
      await loadWishlist()
      toast.success('Ajouté à la wishlist !')
      return true
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la wishlist:', error)
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'ajout à la wishlist'
      toast.error(errorMessage)
      return false
    }
  }

  const removeFromWishlist = async (productIdOrItemId) => {
    try {
      // Si on reçoit un productId, on retrouve l'élément pour extraire son _id
      const found = wishlistItems.find((i) => (i.product?._id || i.product) === productIdOrItemId)
      const idToDelete = found ? found._id : productIdOrItemId
      
      if (!idToDelete) {
        throw new Error('ID de la wishlist non trouvé')
      }
      
      await wishlistService.removeFromWishlist(idToDelete)
      
      // Mise à jour optimiste de l'interface
      setWishlistItems(prevItems => 
        prevItems.filter(item => item._id !== idToDelete && 
          (item.product?._id || item.product) !== productIdOrItemId)
      )
      
      toast.success('Retiré de la wishlist')
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de la wishlist:', error)
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression'
      toast.error(errorMessage)
      
      // Recharger la wishlist en cas d'erreur
      loadWishlist()
      return false
    }
  }

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => 
      item.product?._id === productId || 
      item.product === productId ||
      (typeof item.product === 'object' && item.product?.id === productId)
    )
  }

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId)
    } else {
      return await addToWishlist(productId)
    }
  }

  const value = {
    wishlistItems,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    loadWishlist,
    isAuthenticated: isAuthenticated && user?.role !== 'admin'
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

