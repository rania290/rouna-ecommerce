const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  selectedSize: {
    type: String,
    default: null
  },
  selectedColor: {
    type: String,
    default: null
  },
  price: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances des requêtes
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.product': 1 });

// Middleware pour mettre à jour la date de mise à jour avant de sauvegarder
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Méthode pour calculer le total du panier
cartSchema.methods.calculateTotal = function() {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Méthode pour ajouter un article au panier
cartSchema.methods.addItem = async function(productId, quantity = 1, selectedSize = null, selectedColor = null) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Produit non trouvé');
  }
  
  // Vérifier si le produit est déjà dans le panier avec les mêmes options
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId &&
    item.selectedSize === selectedSize &&
    item.selectedColor === selectedColor
  );
  
  if (existingItemIndex > -1) {
    // Mettre à jour la quantité
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Ajouter un nouvel article
    this.items.push({
      product: product._id,
      quantity,
      selectedSize,
      selectedColor,
      price: product.salePrice || product.price
    });
  }
  
  return this.save();
};

// Méthode pour supprimer un article du panier
cartSchema.methods.removeItem = function(itemId) {
  const itemIndex = this.items.findIndex(item => item._id.toString() === itemId);
  
  if (itemIndex === -1) {
    throw new Error('Article non trouvé dans le panier');
  }
  
  this.items.splice(itemIndex, 1);
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
