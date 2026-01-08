import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'
import api from '../utils/api'

const CART_STORAGE_KEY = 'rouna_cart'
const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, user } = useAuth()

  // Helper pour obtenir la clé de stockage correcte
  const getStorageKey = (userId) => {
    return userId ? `rouna_cart_${userId}` : 'rouna_cart_guest'
  }

  // Fonction pour fusionner les paniers local et serveur
  const mergeCarts = (localCart, serverCart) => {
    const merged = [...localCart]

    serverCart.forEach(serverItem => {
      const exists = merged.some(localItem =>
        localItem._id === serverItem._id &&
        localItem.selectedSize === serverItem.selectedSize &&
        localItem.selectedColor === serverItem.selectedColor
      )

      if (!exists) {
        merged.push(serverItem)
      }
    })

    return merged
  }

  // Synchroniser le panier avec le serveur
  const syncCartWithServer = useCallback(async () => {
    if (!isAuthenticated || !user?._id) return

    try {
      await api.post('/cart/sync', { items: cartItems })
    } catch (error) {
      // console.error('Erreur sync:', error)
    }
  }, [cartItems, isAuthenticated, user])

  // Charger le panier au démarrage ou au changement d'utilisateur
  useEffect(() => {
    let isMounted = true

    const loadCart = async () => {
      try {
        // 1. Déterminer la clé actuelle
        const currentKey = getStorageKey(user?._id)

        // 2. Charger le panier associé à cette clé/utilisateur
        let currentLocalCart = []
        const savedJson = localStorage.getItem(currentKey)
        if (savedJson) {
          currentLocalCart = JSON.parse(savedJson)
        }

        // 3. Gestion de la migration "Invité -> Connecté"
        // Si l'utilisateur vient de se connecter, vérifier s'il avait un panier invité
        if (isAuthenticated && user?._id) {
          const guestJson = localStorage.getItem('rouna_cart_guest')
          if (guestJson) {
            const guestCart = JSON.parse(guestJson)
            if (guestCart.length > 0) {
              // Fusionner le panier invité avec le panier utilisateur local actuel
              currentLocalCart = mergeCarts(currentLocalCart, guestCart)
              // Vider le panier invité car il a été "consommé"
              localStorage.removeItem('rouna_cart_guest')
            }
          }

          // 4. Récupérer et fusionner avec le serveur
          try {
            const response = await api.get('/cart')
            const serverCart = response.data?.items || []

            // Fusionner local (qui inclut potentiellement l'invité) + serveur
            const finalCart = mergeCarts(currentLocalCart, serverCart)

            // Mettre à jour le serveur si changement
            if (finalCart.length > 0) {
              await api.post('/cart/sync', { items: finalCart })
            }

            if (isMounted) setCartItems(finalCart)
          } catch (serverError) {
            console.error("Erreur sync serveur:", serverError)
            if (isMounted) setCartItems(currentLocalCart)
          }
        } else {
          // Mode invité ou déconnecté : utiliser simplement ce qu'on a trouvé
          if (isMounted) setCartItems(currentLocalCart)
        }

      } catch (error) {
        console.error('Erreur chargement panier:', error)
        if (isMounted) setCartItems([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadCart()

    return () => { isMounted = false }
  }, [isAuthenticated, user])

  // Sauvegarder dans le localStorage approprié à chaque changement
  useEffect(() => {
    if (!isLoading) {
      const currentKey = getStorageKey(user?._id)
      localStorage.setItem(currentKey, JSON.stringify(cartItems))

      // Sync serveur si connecté
      if (isAuthenticated && user?._id) {
        syncCartWithServer()
      }
    }
  }, [cartItems, isLoading, isAuthenticated, user, syncCartWithServer])

  const addToCart = (product, quantity = 1, selectedSize = null, selectedColor = null) => {
    const existingItem = cartItems.find(
      (item) =>
        item._id === product._id &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
    )

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item._id === product._id &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      )
    } else {
      setCartItems([
        ...cartItems,
        {
          ...product,
          quantity,
          selectedSize,
          selectedColor,
        },
      ])
    }

    toast.success('Produit ajouté au panier !')
  }

  const removeFromCart = (itemId, selectedSize = null, selectedColor = null) => {
    setCartItems(
      cartItems.filter(
        (item) =>
          !(
            item._id === itemId &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
          )
      )
    )
    toast.success('Produit retiré du panier')
  }

  const updateQuantity = (itemId, quantity, selectedSize = null, selectedColor = null) => {
    if (quantity <= 0) {
      removeFromCart(itemId, selectedSize, selectedColor)
      return
    }

    setCartItems(
      cartItems.map((item) =>
        item._id === itemId &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
          ? { ...item, quantity }
          : item
      )
    )
  }

  const clearCart = async () => {
    setCartItems([])

    if (isAuthenticated) {
      try {
        await api.delete('/cart')
      } catch (error) {
        // Commented out console.error to prevent memory accumulation
        // console.error('Erreur lors de la suppression du panier:', error)
      }
    }

    toast.success('Panier vidé')
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.salePrice || item.price
      return total + price * item.quantity
    }, 0)
  }

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    isLoading
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
