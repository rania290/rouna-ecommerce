import { useState, useEffect } from 'react'
import { productService } from '../services/productService'
import { authService } from '../services/authService'

const TestImages = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState('')

  useEffect(() => {
    loadProducts()
    runConnectionTest()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.getProducts({ limit: 10 })
      setProducts(data.products || data.docs || data || [])
      console.log('📦 Produits chargés:', data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const runConnectionTest = async () => {
    let results = '🧪 Test de connexion à l\'API...\n\n'

    try {
      // Test de l'endpoint des produits
      results += '📦 Test des produits...\n'
      const productsResponse = await productService.getProducts({ limit: 5 })
      results += `✅ Produits récupérés: ${productsResponse.products?.length || productsResponse.length || 0} produits\n\n`

      // Test de l'authentification si token existe
      const token = localStorage.getItem('accessToken')
      if (token) {
        results += '🔐 Test de l\'authentification...\n'
        try {
          const authResponse = await authService.getMe()
          results += `✅ Utilisateur authentifié: ${authResponse.data?.user?.email || 'N/A'}\n\n`
        } catch (authError) {
          results += `❌ Erreur d'authentification: ${authError.response?.data?.message || authError.message}\n`
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          results += '🧹 Tokens supprimés du localStorage\n\n'
        }
      } else {
        results += 'ℹ️ Aucun token d\'authentification trouvé\n\n'
      }

      // Test des images
      const testProducts = productsResponse.products || productsResponse
      if (testProducts?.length > 0) {
        const firstProduct = testProducts[0]
        results += `🖼️ Premier produit: ${firstProduct.name}\n`
        results += `🖼️ Images: ${firstProduct.images?.length || 0}\n`
        if (firstProduct.images?.length > 0) {
          results += `🖼️ URL de la première image: ${firstProduct.images[0].url}\n`
        }
      }

    } catch (error) {
      results += `❌ Erreur de connexion: ${error.message}\n`
      if (error.response) {
        results += `❌ Status: ${error.response.status}\n`
        results += `❌ Data: ${JSON.stringify(error.response.data, null, 2)}\n`
      }
    }

    setTestResults(results)
  }

  const testImageUrls = [
    '/uploads/products/images-1766357545973-552362291.jpeg',
    '/uploads/products/images-1766357566585-337233545.jpeg',
    '/uploads/products/bague.jpg',
    'http://localhost:5000/uploads/products/images-1766357545973-552362291.jpeg',
    'http://localhost:5000/uploads/products/images-1766357566585-337233545.jpeg',
    'http://localhost:5000/uploads/products/bague.jpg'
  ]

  return (
    <div className="py-8">
      <div className="container-custom">
        <h1 className="text-4xl font-bold mb-8">Test d'images des produits</h1>

        {/* Résultats du test de connexion */}
        <div className="mb-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Résultats du test de connexion</h2>
          <button
            onClick={runConnectionTest}
            className="btn btn-primary mb-4"
          >
            Relancer le test
          </button>
          <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border overflow-auto max-h-60">
            {testResults || 'Test en cours...'}
          </pre>
        </div>

        {/* Test direct des URLs d'images */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Test des URLs d'images connues</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {testImageUrls.map((url, index) => (
              <div key={index} className="border p-4">
                <p className="text-sm mb-2 break-all">{url}</p>
                <img
                  src={url}
                  alt={`Test ${index + 1}`}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    console.log(`❌ Erreur pour ${url}`)
                    e.target.src = 'https://via.placeholder.com/200x200?text=Erreur'
                  }}
                  onLoad={() => console.log(`✅ Image chargée: ${url}`)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Affichage des produits */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Produits depuis l'API</h2>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product._id} className="border p-4">
                  <h3 className="font-bold mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">Prix: {product.price} DT</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Images: {product.images?.length || 0}
                  </p>

                  {product.images && product.images.length > 0 ? (
                    <div className="space-y-2">
                      {product.images.map((img, imgIndex) => (
                        <div key={imgIndex}>
                          <p className="text-xs break-all">URL: {img.url}</p>
                          <img
                            src={img.url.startsWith('http') ? img.url : img.url}
                            alt={img.altText}
                            className="w-full h-24 object-cover border"
                            onError={(e) => {
                              console.log(`❌ Erreur image produit ${product.name}:`, img.url)
                              e.target.src = 'https://via.placeholder.com/200x200?text=Erreur'
                            }}
                            onLoad={() => console.log(`✅ Image chargée pour ${product.name}:`, img.url)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-red-500">Aucune image</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestImages
