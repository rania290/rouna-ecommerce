import ProductCard from './ProductCard'
import { Loader } from 'lucide-react'

// Modifiez ProductGrid.jsx
const ProductGrid = ({ products, loading, isAdmin = false, onEdit, onDelete }) => {
  // CONVERTIR products en tableau si nécessaire
  let productsArray = products;
  
  // Si products est un objet avec une propriété 'products'
  if (products && typeof products === 'object' && !Array.isArray(products)) {
    console.log('🔄 Conversion de l objet en tableau...', products);
    productsArray = products.products || products.data || products.items || [];
  }
  
  // Vérifiez que c'est bien un tableau maintenant
  if (!Array.isArray(productsArray)) {
    console.error('❌ products n est toujours pas un tableau:', productsArray);
    productsArray = [];
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!productsArray || productsArray.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-secondary-600 text-lg">Aucun produit trouvé</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {productsArray.map((product) => (
        <ProductCard 
          key={product._id || product.id} 
          product={product} 
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export default ProductGrid