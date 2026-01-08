const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// Ajouter un produit à la liste de souhaits
const addToWishlist = async (req, res) => {
  try {
    const { productId, notes } = req.body;

    // Vérifier si le produit existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé.'
      });
    }

    // Vérifier si le produit est déjà dans la liste de souhaits
    const existingItem = await Wishlist.findOne({
      user: req.user.id,
      product: productId
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Ce produit est déjà dans votre liste de souhaits.'
      });
    }

    // Ajouter à la liste de souhaits
    const wishlistItem = await Wishlist.create({
      user: req.user.id,
      product: productId,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Produit ajouté à la liste de souhaits.',
      data: wishlistItem
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ce produit est déjà dans votre liste de souhaits.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout à la liste de souhaits.',
      error: error.message
    });
  }
};

// Récupérer la liste de souhaits d'un utilisateur
const getWishlist = async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ user: req.user.id })
      .populate({
        path: 'product',
        select: 'name price images isOnSale salePrice stock isActive',
        match: { isActive: true }
      })
      .sort('-addedAt');

    // Filtrer les produits qui pourraient être supprimés
    const filteredItems = wishlistItems.filter(item => item.product);

    res.json({
      success: true,
      data: filteredItems
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la liste de souhaits.',
      error: error.message
    });
  }
};

// Supprimer un produit de la liste de souhaits
const removeFromWishlist = async (req, res) => {
  try {
    const wishlistItem = await Wishlist.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Élément non trouvé dans la liste de souhaits.'
      });
    }

    res.json({
      success: true,
      message: 'Produit retiré de la liste de souhaits.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la liste de souhaits.',
      error: error.message
    });
  }
};

// Vérifier si un produit est dans la liste de souhaits
const checkInWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOne({
      user: req.user.id,
      product: productId
    });

    res.json({
      success: true,
      data: {
        isInWishlist: !!wishlistItem,
        wishlistItem: wishlistItem || null
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification.',
      error: error.message
    });
  }
};

// Vider la liste de souhaits
const clearWishlist = async (req, res) => {
  try {
    await Wishlist.deleteMany({ user: req.user.id });

    res.json({
      success: true,
      message: 'Liste de souhaits vidée avec succès.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la liste de souhaits.',
      error: error.message
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  checkInWishlist,
  clearWishlist
};