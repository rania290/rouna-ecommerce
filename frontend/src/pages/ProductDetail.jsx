import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Star, Minus, Plus, Loader, Trash2 } from 'lucide-react'
import { productService } from '../services/productService'
import { reviewService } from '../services/reviewService'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useAuth } from '../contexts/AuthContext'
import ProductGrid from '../components/Product/ProductGrid'
import AIRecommendations from '../components/Product/AIRecommendations'
import toast from 'react-hot-toast'

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    loadProduct()
  }, [slug])

  const loadProduct = async () => {
    try {
      setLoading(true)
      console.log('🔄 Chargement du produit avec le slug:', slug)
      const productData = await productService.getProductBySlug(slug)
      console.log('📦 Données du produit reçues:', productData)

      const p = productData.data || productData.product || productData

      if (!p) {
        console.error('❌ Aucune donnée de produit trouvée pour le slug:', slug)
        throw new Error('Produit non trouvé')
      }

      console.log('✅ Produit trouvé:', { id: p._id, name: p.name, slug: p.slug })
      setProduct(p)

      // Charger les produits apparentés
      try {
        console.log('🔄 Chargement des produits apparentés...')
        const relatedData = await productService.getRelatedProducts(p._id)
        console.log('✅ Produits apparentés chargés:', relatedData?.length || 0)
        setRelatedProducts(Array.isArray(relatedData) ? relatedData : [])
      } catch (error) {
        console.error('⚠️ Erreur lors du chargement des produits apparentés:', error)
        setRelatedProducts([])
      }

      // Charger les avis séparément
      try {
        console.log(`🔄 Chargement des avis pour le produit ${p._id}...`)
        const reviewsData = await reviewService.getProductReviews(p._id)
        console.log('📝 Réponse complète des avis:', reviewsData)

        // Gérer différents formats de réponse
        let reviewsList = [];
        if (Array.isArray(reviewsData)) {
          reviewsList = reviewsData;
        } else if (reviewsData?.data?.reviews) {
          reviewsList = reviewsData.data.reviews;
        } else if (reviewsData?.reviews) {
          reviewsList = reviewsData.reviews;
        } else if (reviewsData?.data) {
          reviewsList = Array.isArray(reviewsData.data) ? reviewsData.data : [reviewsData.data];
        }

        console.log(`✅ ${reviewsList.length} avis chargés`)
        setReviews(reviewsList)
      } catch (error) {
        console.error('❌ Erreur lors du chargement des avis:', error)
        setReviews([])
      }

      // Initialiser les sélections
      if (p.sizes && p.sizes.length > 0) {
        setSelectedSize(p.sizes[0])
      }
      if (p.colors && p.colors.length > 0) {
        setSelectedColor(p.colors[0])
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du produit:', error)
      toast.error('Produit non trouvé')
      navigate('/products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    addToCart(product, quantity, selectedSize, selectedColor)
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    addToCart(product, quantity, selectedSize, selectedColor)
    navigate('/checkout')
  }

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
      try {
        await reviewService.deleteReview(reviewId)
        toast.success('Avis supprimé avec succès')
        // Recharger les avis
        const reviewsData = await reviewService.getProductReviews(product._id)
        let reviewsList = [];
        if (Array.isArray(reviewsData)) {
          reviewsList = reviewsData;
        } else if (reviewsData?.data?.reviews) {
          reviewsList = reviewsData.data.reviews;
        } else if (reviewsData?.reviews) {
          reviewsList = reviewsData.reviews;
        } else if (reviewsData?.data) {
          reviewsList = Array.isArray(reviewsData.data) ? reviewsData.data : [reviewsData.data];
        }
        setReviews(reviewsList)
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'avis:', error)
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    toggleWishlist(product._id)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-secondary-600 text-lg">Produit non trouvé</p>
      </div>
    )
  }

  const images = product.images || []
  const mainImage = images[selectedImage]?.url || images[0]?.url || ''
  const imageUrl = mainImage?.startsWith('http')
    ? mainImage
    : mainImage?.startsWith('/')
      ? `http://localhost:5000${mainImage}`
      : mainImage
        ? `http://localhost:5000/uploads/${mainImage}`
        : ''
  const fallbackUrl = 'https://via.placeholder.com/800x800?text=Image+indisponible'
  const displayImage = imageUrl || fallbackUrl

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/800x800?text=Image+indisponible'
  }

  const price = product.salePrice || product.price
  const originalPrice = product.salePrice ? product.price : null

  return (
    <div className="py-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-xl overflow-hidden mb-4">
              <img
                src={displayImage}
                alt={product.name}
                onError={handleImageError}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${selectedImage === index
                      ? 'border-primary-600'
                      : 'border-transparent'
                      }`}
                  >
                    <img
                      src={
                        img.url.startsWith('http')
                          ? img.url
                          : `http://localhost:5000/uploads/${img.url}`
                      }
                      alt={img.altText || product.name}
                      onError={handleImageError}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 mb-4">
              {product.name}
            </h1>

            {product.rating?.average > 0 && (
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.round(product.rating.average)
                        ? 'text-yellow-500 fill-current'
                        : 'text-secondary-300'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-secondary-600">
                  ({product.rating.count} avis)
                </span>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-2">
                <span className="text-4xl font-bold text-primary-600">
                  {price.toFixed(2)} DT
                </span>
                {originalPrice && (
                  <span className="text-2xl text-secondary-500 line-through">
                    {originalPrice.toFixed(2)} DT
                  </span>
                )}
              </div>
              {product.isOnSale && (
                <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                  -{product.salePercentage || Math.round(((product.price - price) / product.price) * 100)}% de réduction
                </span>
              )}
            </div>

            <p className="text-secondary-700 mb-6 leading-relaxed">
              {product.description}
            </p>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Taille</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border-2 rounded-lg transition-colors ${selectedSize === size
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-secondary-300 hover:border-primary-400'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Couleur</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border-2 rounded-lg transition-colors ${selectedColor === color
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-secondary-300 hover:border-primary-400'
                        }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Quantité</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-secondary-300 rounded-lg hover:bg-secondary-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-semibold w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2 border border-secondary-300 rounded-lg hover:bg-secondary-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-secondary-600">
                  {product.stock} en stock
                </span>
              </div>
            </div>

            {/* Actions */}
            {user?.role !== 'admin' && (
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  onClick={handleAddToCart}
                  className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Ajouter au panier</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  className="btn btn-outline flex-1"
                >
                  Acheter maintenant
                </button>
                <button
                  onClick={handleWishlistToggle}
                  className={`btn ${isInWishlist(product._id)
                    ? 'bg-primary-600 text-white'
                    : 'btn-outline'
                    }`}
                >
                  <Heart
                    className="w-5 h-5"
                    fill={isInWishlist(product._id) ? 'currentColor' : 'none'}
                  />
                </button>
              </div>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="border-t border-secondary-200 pt-6">
                <h3 className="font-semibold mb-3">Caractéristiques</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-primary-600">•</span>
                      <span className="text-secondary-700">
                        <strong>{feature.name}:</strong> {feature.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        {user?.role !== 'admin' && (
          <section className="mb-16" id="reviews">
            <h2 className="text-2xl font-bold mb-6">
              Avis clients {reviews.length > 0 && `(${reviews.length})`}
            </h2>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-white p-6 rounded-lg shadow relative">
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Supprimer l'avis"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">
                          {review.user?.username || 'Anonyme'}
                          {review.isVerifiedPurchase && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              Achat vérifié
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${i < (review.rating || 5)
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt || new Date()).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {review.title && (
                      <h5 className="font-semibold text-lg mb-2">{review.title}</h5>
                    )}
                    <p className="text-gray-700 whitespace-pre-line">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-600 mb-4">Aucun avis pour le moment.</p>
                {isAuthenticated && (
                  <button
                    onClick={() => document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-primary-600 hover:text-primary-800 font-medium"
                  >
                    Soyez le premier à laisser un avis
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Bijoux similaires</h2>
            <ProductGrid
              products={relatedProducts.slice(0, 4)}
              loading={false}
              isAdmin={user?.role === 'admin'}
            />
          </section>
        )}

        {/* Review Form */}
        {isAuthenticated && user?.role !== 'admin' && (
          <section id="review-form" className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Laisser un avis</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const reviewData = {
                  productId: product._id,
                  rating: parseInt(formData.get('rating')),
                  title: formData.get('title'),
                  comment: formData.get('comment'),
                };
                console.log('Données à envoyer:', reviewData);

                try {
                  const response = await reviewService.createReview(reviewData);
                  console.log('Avis créé avec succès:', response);
                  toast.success('Votre avis a été enregistré avec succès !');
                  // Recharger les avis
                  const reviewsData = await reviewService.getProductReviews(product._id);
                  setReviews(reviewsData);
                } catch (error) {
                  console.error('Erreur lors de la création de l\'avis:', error);

                  // Afficher un message d'erreur plus détaillé
                  if (error.response) {
                    // La requête a été faite et le serveur a répondu avec un statut d'erreur
                    const { status, data } = error.response;

                    if (status === 400 && data.errors) {
                      // Erreurs de validation
                      const errorMessages = data.errors.map(err => err.msg).join('\n');
                      toast.error(`Erreur de validation : ${errorMessages}`);
                    } else if (status === 400 && data.message) {
                      // Message d'erreur personnalisé du serveur
                      toast.error(data.message);
                    } else if (status === 401) {
                      toast.error('Veuillez vous connecter pour laisser un avis');
                    } else if (status === 403) {
                      toast.error('Vous devez avoir acheté ce produit pour laisser un avis');
                    } else if (status === 404) {
                      toast.error('Produit non trouvé');
                    } else {
                      toast.error(`Erreur serveur (${status}) : ${data.message || 'Veuillez réessayer plus tard'}`);
                    }
                  } else if (error.request) {
                    // La requête a été faite mais aucune réponse n'a été reçue
                    console.error('Aucune réponse du serveur:', error.request);
                    toast.error('Impossible de se connecter au serveur. Vérifiez votre connexion Internet.');
                  } else {
                    // Une erreur s'est produite lors de la configuration de la requête
                    console.error('Erreur de configuration de la requête:', error.message);
                    toast.error('Erreur de configuration de la requête');
                  }
                }
              }}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Note</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="relative">
                        <input
                          type="radio"
                          id={`star${star}`}
                          name="rating"
                          value={star}
                          className="sr-only"
                          required
                        />
                        <label
                          htmlFor={`star${star}`}
                          className="cursor-pointer text-2xl"
                        >
                          <Star
                            className={`w-6 h-6 ${star <= 5 ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                    Titre de l'avis
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Donnez un titre à votre avis"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="comment" className="block text-gray-700 font-medium mb-2">
                    Votre avis
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Partagez votre expérience avec ce produit..."
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Publier mon avis
                </button>
              </form>
            </div>
          </section>
        )}

        {/* AI Recommendations */}
        {user && (
          <AIRecommendations userId={user._id} productId={product._id} />
        )}
      </div>
    </div>
  )
}

export default ProductDetail
