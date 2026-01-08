import api from './utils/api'

async function testConnection() {
  try {
    console.log('🧪 Test de connexion à l\'API...')

    // Test de l'endpoint des produits
    console.log('📦 Test des produits...')
    const productsResponse = await api.get('/products')
    console.log('✅ Produits récupérés:', productsResponse.data?.products?.length || 0, 'produits')

    // Test de l'authentification si token existe
    const token = localStorage.getItem('accessToken')
    if (token) {
      console.log('🔐 Test de l\'authentification...')
      try {
        const authResponse = await api.get('/auth/me')
        console.log('✅ Utilisateur authentifié:', authResponse.data?.data?.user?.email)
      } catch (authError) {
        console.log('❌ Erreur d\'authentification:', authError.response?.data?.message)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    } else {
      console.log('ℹ️ Aucun token d\'authentification trouvé')
    }

    // Test des images
    if (productsResponse.data?.products?.length > 0) {
      const firstProduct = productsResponse.data.products[0]
      console.log('🖼️ Premier produit:', firstProduct.name)
      console.log('🖼️ Images:', firstProduct.images?.length || 0)
      if (firstProduct.images?.length > 0) {
        console.log('🖼️ URL de la première image:', firstProduct.images[0].url)
      }
    }

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
    if (error.response) {
      console.error('❌ Status:', error.response.status)
      console.error('❌ Data:', error.response.data)
    }
  }
}

testConnection()