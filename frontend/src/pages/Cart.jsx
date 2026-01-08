import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="py-20">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-secondary-900 mb-4">
            Connectez-vous pour accéder au panier
          </h2>
          <p className="text-secondary-600 mb-8">
            Veuillez vous connecter ou créer un compte pour gérer votre panier.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/login" className="btn btn-primary">
              Se connecter
            </Link>
            <Link to="/register" className="btn btn-outline">
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (user?.role === 'admin') {
    return (
      <div className="py-20">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-secondary-900 mb-4">
            Accès non autorisé
          </h2>
          <p className="text-secondary-600 mb-8">
            Les administrateurs n'ont pas accès au panier.
          </p>
          <Link to="/admin" className="btn btn-primary">
            Aller au panneau admin
          </Link>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="py-20">
        <div className="container-custom text-center">
          <ShoppingBag className="w-24 h-24 mx-auto text-secondary-300 mb-6" />
          <h2 className="text-3xl font-bold text-secondary-900 mb-4">
            Votre panier est vide
          </h2>
          <p className="text-secondary-600 mb-8">
            Découvrez nos bijoux et ajoutez-les à votre panier
          </p>
          <Link to="/products" className="btn btn-primary">
            Explorer les bijoux
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <h1 className="text-4xl font-bold text-secondary-900 mb-8">
          Mon panier
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => {
              const imageUrl =
                item.images?.[0]?.url?.startsWith('http')
                  ? item.images[0].url
                  : `http://localhost:5000/uploads/${item.images?.[0]?.url || 'placeholder.jpg'}`

              const price = item.salePrice || item.price

              return (
                <motion.div
                  key={`${item._id}-${item.selectedSize}-${item.selectedColor}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card p-6"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full sm:w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                      {item.selectedSize && (
                        <p className="text-sm text-secondary-600 mb-1">
                          Taille: {item.selectedSize}
                        </p>
                      )}
                      {item.selectedColor && (
                        <p className="text-sm text-secondary-600 mb-1">
                          Couleur: {item.selectedColor}
                        </p>
                      )}
                      <p className="text-primary-600 font-bold text-lg">
                        {price.toFixed(2)} DT
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() =>
                          removeFromCart(item._id, item.selectedSize, item.selectedColor)
                        }
                        className="p-2 text-secondary-600 hover:text-primary-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item._id,
                              item.quantity - 1,
                              item.selectedSize,
                              item.selectedColor
                            )
                          }
                          className="p-1 border border-secondary-300 rounded hover:bg-secondary-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item._id,
                              item.quantity + 1,
                              item.selectedSize,
                              item.selectedColor
                            )
                          }
                          className="p-1 border border-secondary-300 rounded hover:bg-secondary-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-lg font-bold mt-2">
                        {(price * item.quantity).toFixed(2)} DT
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            <button
              onClick={clearCart}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Vider le panier
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Résumé de la commande</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Sous-total</span>
                  <span className="font-semibold">{getCartTotal().toFixed(2)} DT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Livraison</span>
                  <span className="font-semibold">Gratuite</span>
                </div>
                <div className="border-t border-secondary-200 pt-4">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary-600">
                      {getCartTotal().toFixed(2)} DT
                    </span>
                  </div>
                </div>
              </div>
              <Link
                to="/checkout"
                className="btn btn-primary w-full text-center block"
              >
                Passer la commande
              </Link>
              <Link
                to="/products"
                className="btn btn-outline w-full text-center block mt-3"
              >
                Continuer les achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
