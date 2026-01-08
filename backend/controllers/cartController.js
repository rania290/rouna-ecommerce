const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: []
      });
      await cart.save();
    }
    
    // Récupérer les détails complets des produits
    const itemsWithDetails = await Promise.all(cart.items.map(async (item) => {
      const product = await Product.findById(item.product);
      if (!product) return null;
      
      return {
        ...item.toObject(),
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          salePrice: product.salePrice,
          images: product.images,
          stock: product.stock
        }
      };
    }));
    
    // Filtrer les produits non trouvés
    const validItems = itemsWithDetails.filter(item => item !== null);
    
    res.status(200).json({
      success: true,
      items: validItems
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération du panier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du panier',
      error: error.message
    });
  }
};

const syncCart = async (req, res) => {
  try {
    const { items } = req.body;
    
    // Valider les articles
    const validatedItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId || item.product?._id);
      
      if (!product) continue;
      
      validatedItems.push({
        product: product._id,
        quantity: Math.min(item.quantity, product.stock), // Ne pas dépasser le stock disponible
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
        price: product.salePrice || product.price
      });
    }
    
    // Mettre à jour ou créer le panier
    let cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { 
        $set: { 
          items: validatedItems,
          updatedAt: new Date()
        } 
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Panier synchronisé avec succès',
      cart
    });
    
  } catch (error) {
    console.error('Erreur lors de la synchronisation du panier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation du panier',
      error: error.message
    });
  }
};

const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [], updatedAt: new Date() } },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Panier vidé avec succ'
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression du panier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du panier',
      error: error.message
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, selectedSize, selectedColor } = req.body;
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Panier non trouvé'
      });
    }
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé dans le panier'
      });
    }
    
    // Mettre à jour l'article
    if (quantity !== undefined) {
      cart.items[itemIndex].quantity = quantity;
    }
    
    if (selectedSize !== undefined) {
      cart.items[itemIndex].selectedSize = selectedSize;
    }
    
    if (selectedColor !== undefined) {
      cart.items[itemIndex].selectedColor = selectedColor;
    }
    
    cart.updatedAt = new Date();
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Article mis à jour avec succès',
      cart
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'article',
      error: error.message
    });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Panier non trouvé'
      });
    }
    
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    cart.updatedAt = new Date();
    
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Article retiré du panier avec succès',
      cart
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'article',
      error: error.message
    });
  }
};

module.exports = {
  getCart,
  syncCart,
  clearCart,
  updateCartItem,
  removeCartItem
};
