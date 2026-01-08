import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { ArrowLeft, Save, Loader, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'

const ProductForm = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    salePrice: '',
    category: '',
    stock: '',
    sku: '',
    brand: '',
    tags: '',
    colors: '',
    sizes: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    isFeatured: false,
    isOnSale: false,
    isNewProduct: false,
    metaTitle: '',
    metaDescription: ''
  })

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/')
    }
    loadCategories()
    if (isEditing) {
      loadProduct()
    }
  }, [user, navigate, isEditing, id])

  const loadCategories = async () => {
    try {
      const { data } = await categoryService.getCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error)
      toast.error('Erreur lors du chargement des catégories')
      setCategories([])
    }
  }

  const loadProduct = async () => {
    try {
      setLoading(true)
      const data = await productService.getProductById(id)
      const product = data.data || data

      setFormData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price || '',
        salePrice: product.salePrice || '',
        category: product.category?._id || product.category || '',
        stock: product.stock || '',
        sku: product.sku || '',
        brand: product.brand || '',
        tags: product.tags?.join(', ') || '',
        colors: product.colors?.join(', ') || '',
        sizes: product.sizes?.join(', ') || '',
        weight: product.weight || '',
        dimensions: {
          length: product.dimensions?.length || '',
          width: product.dimensions?.width || '',
          height: product.dimensions?.height || ''
        },
        isFeatured: product.isFeatured || false,
        isOnSale: product.isOnSale || false,
        isNewProduct: product.isNewProduct || false,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || ''
      })

      setExistingImages(product.images || [])
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error)
      toast.error('Erreur lors du chargement du produit')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleDimensionChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [name]: value
      }
    }))
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    setImages(prev => [...prev, ...files])
  }

  const removeImage = (index, isExisting = false) => {
    if (isExisting) {
      setExistingImages(prev => prev.filter((_, i) => i !== index))
    } else {
      setImages(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      const submitData = new FormData()

      // Ajouter les champs de base
      submitData.append('name', formData.name)
      submitData.append('description', formData.description)
      submitData.append('shortDescription', formData.shortDescription || '')
      submitData.append('price', parseFloat(formData.price))
      submitData.append('category', formData.category)
      submitData.append('stock', parseInt(formData.stock, 10) || 0)
      submitData.append('sku', formData.sku || '')
      submitData.append('brand', formData.brand || '')
      submitData.append('weight', formData.weight || '')
      submitData.append('isFeatured', formData.isFeatured)
      submitData.append('isOnSale', formData.isOnSale)
      
      if (formData.salePrice) {
        submitData.append('salePrice', parseFloat(formData.salePrice))
      }

      // Ajouter les tableaux
      if (formData.tags) {
        const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t)
        submitData.append('tags', JSON.stringify(tags))
      }
      
      if (formData.colors) {
        const colors = formData.colors.split(',').map(c => c.trim()).filter(c => c)
        submitData.append('colors', JSON.stringify(colors))
      }
      
      if (formData.sizes) {
        const sizes = formData.sizes.split(',').map(s => s.trim()).filter(s => s)
        submitData.append('sizes', JSON.stringify(sizes))
      }

      // Ajouter les dimensions
      submitData.append('dimensions', JSON.stringify({
        length: formData.dimensions.length || 0,
        width: formData.dimensions.width || 0,
        height: formData.dimensions.height || 0
      }))

      // Ajouter les nouvelles images
      images.forEach((image) => {
        if (image instanceof File) {
          submitData.append('images', image)
        }
      })

      // Ajouter les images existantes
      if (existingImages.length > 0) {
        submitData.append('existingImages', JSON.stringify(existingImages))
      }

      // Afficher les données pour le débogage
      console.log('Données du formulaire :')
      for (let [key, value] of submitData.entries()) {
        console.log(`${key}:`, value)
      }

      // Envoyer les données
      if (isEditing) {
        await productService.updateProduct(id, submitData)
        toast.success('Produit mis à jour avec succès')
      } else {
        await productService.createProduct(submitData)
        toast.success('Produit créé avec succès')
      }

      navigate('/admin/products')
    } catch (error) {
      console.error('Erreur détaillée :', error.response?.data || error.message)
      const errorMessage = error.response?.data?.message || 
                         `Erreur lors de ${isEditing ? 'la mise à jour' : 'la création'} du produit`
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/admin/products')}
            className="btn btn-outline mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
          <h1 className="text-4xl font-bold text-secondary-900">
            {isEditing ? 'Modifier le produit' : 'Ajouter un produit'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informations de base */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Informations de base</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom du produit *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description courte</label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Marque</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Prix et stock */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Prix et stock</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prix (€) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Prix soldé (€)</label>
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Variantes */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Variantes</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Couleurs (séparées par des virgules)</label>
                  <input
                    type="text"
                    name="colors"
                    value={formData.colors}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Rouge, Bleu, Vert"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tailles (séparées par des virgules)</label>
                  <input
                    type="text"
                    name="sizes"
                    value={formData.sizes}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="S, M, L, XL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tags (séparés par des virgules)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="nouveau, populaire, soldes"
                  />
                </div>
              </div>
            </div>

            {/* Dimensions et poids */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Dimensions et poids</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Poids (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Longueur (cm)</label>
                    <input
                      type="number"
                      name="length"
                      value={formData.dimensions.length}
                      onChange={handleDimensionChange}
                      step="0.01"
                      min="0"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Largeur (cm)</label>
                    <input
                      type="number"
                      name="width"
                      value={formData.dimensions.width}
                      onChange={handleDimensionChange}
                      step="0.01"
                      min="0"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hauteur (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.dimensions.height}
                      onChange={handleDimensionChange}
                      step="0.01"
                      min="0"
                      className="input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Statuts */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Statuts</h2>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Produit vedette
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isOnSale"
                    checked={formData.isOnSale}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  En solde
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isNewProduct"
                    checked={formData.isNewProduct}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Nouveau produit
                </label>
              </div>
            </div>

            {/* SEO */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">SEO</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meta titre</label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Meta description</label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    rows={3}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="card p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">Images du produit</h2>

            {/* Images existantes */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Images actuelles</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url.startsWith('http') ? image.url : `http://localhost:5000${image.url}`}
                        alt={image.altText}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index, true)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload nouvelles images */}
            <div>
              <label className="block text-sm font-medium mb-2">Ajouter de nouvelles images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Cliquez pour ajouter des images</p>
                </div>
              </label>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="btn btn-outline"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center"
            >
              {loading ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEditing ? 'Mettre à jour' : 'Créer le produit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductForm