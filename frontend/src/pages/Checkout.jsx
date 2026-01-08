import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Banknote, MapPin, User, Mail, Phone } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { orderService } from '../services/orderService'
import toast from 'react-hot-toast'

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (user?.role === 'admin') {
    return (
      <div className="py-20">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-secondary-900 mb-4">
            Accès non autorisé
          </h2>
          <p className="text-secondary-600 mb-8">
            Les administrateurs n'ont pas accès au checkout.
          </p>
          <Link to="/admin" className="btn btn-primary">
            Aller au panneau admin
          </Link>
        </div>
      </div>
    )
  }
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    shippingAddress: {
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      street: user?.profile?.address || '',
      city: user?.profile?.city || '',
      postalCode: user?.profile?.postalCode || '',
      country: user?.profile?.country || 'France',
      phone: user?.profile?.phone || '',
    },
    email: user?.email || '',
    paymentMethod: 'cash_on_delivery',
    notes: ''
  })

  if (!isAuthenticated) {
    navigate('/login?redirect=/checkout')
    return null
  }

  if (cartItems.length === 0) {
    navigate('/cart')
    return null
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Mise à jour des champs de l'adresse de livraison
    if (['firstName', 'lastName', 'street', 'city', 'postalCode', 'country', 'phone'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [name]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Valider les données avant envoi
      if (!formData.shippingAddress.phone || !formData.shippingAddress.street) {
        throw new Error('Veuillez remplir tous les champs obligatoires')
      }

      const orderData = {
        items: cartItems.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
          size: item.selectedSize,
          color: item.selectedColor,
        })),
        ...formData, // Inclut shippingAddress, paymentMethod, email, notes
        email: formData.email || user?.email // S'assurer que l'email est défini
      }

      console.log('Données de commande envoyées:', JSON.stringify(orderData, null, 2))

      const response = await orderService.createOrder(orderData)

      clearCart()

      // Si un PDF est généré, le télécharger automatiquement
      if (response.data?.pdf) {
        try {
          const { data: pdfData, filename } = response.data.pdf

          // Convertir les données base64 en Uint8Array
          const pdfBytes = Uint8Array.from(atob(pdfData), c => c.charCodeAt(0))

          // Créer le blob PDF
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })

          // Créer un lien de téléchargement temporaire
          const url = URL.createObjectURL(pdfBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = filename || `ticket-commande-${Date.now()}.pdf`
          link.style.display = 'none'

          // Ajouter au DOM, cliquer, puis supprimer
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          // Nettoyer l'URL
          setTimeout(() => URL.revokeObjectURL(url), 100)

          console.log('PDF téléchargé automatiquement:', filename)
        } catch (pdfError) {
          console.error('Erreur lors du téléchargement automatique du PDF:', pdfError)
        }
      }

      toast.success('Commande passée avec succès ! Un ticket PDF a été généré et téléchargé automatiquement.')
      navigate(`/orders/${response.data?.order?._id || response.data?._id}`)
    } catch (error) {
      console.error('Erreur complète:', error)
      console.error('Réponse du serveur:', error.response?.data)
      toast.error(error.response?.data?.message || `Erreur lors de la commande: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <h1 className="text-4xl font-bold text-secondary-900 mb-8">
          Finaliser la commande
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="card p-6">
              <div className="flex items-center space-x-2 mb-6">
                <MapPin className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-bold">Adresse de livraison</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    name="firstName"
                    value={formData.shippingAddress.firstName}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    name="lastName"
                    value={formData.shippingAddress.lastName}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.shippingAddress.phone}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    required
                    name="street"
                    value={formData.shippingAddress.street}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ville *
                  </label>
                  <input
                    type="text"
                    required
                    name="city"
                    value={formData.shippingAddress.city}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    required
                    name="postalCode"
                    value={formData.shippingAddress.postalCode}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pays *
                  </label>
                  <input
                    type="text"
                    required
                    name="country"
                    value={formData.shippingAddress.country}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Banknote className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-bold">Méthode de paiement</h2>
              </div>
              <div className="p-4 border-2 border-primary-600 rounded-lg bg-primary-50">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full border-4 border-primary-600"></div>
                  <span className="font-semibold text-primary-900">Paiement à la livraison</span>
                </div>
                <p className="text-sm text-primary-700 mt-2 ml-7">
                  Payez en espèces dès réception de votre commande à votre domicile.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Résumé</h2>
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-secondary-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span>
                      {((item.salePrice || item.price) * item.quantity).toFixed(2)} DT
                    </span>
                  </div>
                ))}
                <div className="border-t border-secondary-200 pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-secondary-600">Sous-total</span>
                    <span>{getCartTotal().toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-secondary-600">Livraison</span>
                    <span>Gratuite</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-4 border-t border-secondary-200">
                    <span>Total</span>
                    <span className="text-primary-600">
                      {getCartTotal().toFixed(2)} DT
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? 'Traitement...' : 'Confirmer la commande'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Checkout
