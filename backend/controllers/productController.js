const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const { validationResult } = require('express-validator');


// Créer un produit
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erreurs de validation:', errors.array());
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({
        success: false,
        message: `Erreur de validation: ${errorMessages}`,
        errors: errors.array().map(err => ({
          param: err.param,
          msg: err.msg,
          value: err.value
        }))
      });
    }

    // Vérifier si la catégorie existe
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'La catégorie spécifiée n\'existe pas.'
      });
    }

    // Générer un slug à partir du nom
    const slug = req.body.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Helper pour parser les champs tableaux
    const parseArrayField = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          // Si ce n'est pas du JSON valide, on split par virgule
        }
        return value.split(',').map(item => item.trim()).filter(Boolean);
      }
      return [];
    };

    // Préparer les données du produit
    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock,
      slug,
      shortDescription: req.body.shortDescription || '',
      sku: req.body.sku || '',
      brand: req.body.brand || '',
      isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
      isOnSale: req.body.isOnSale === true || req.body.isOnSale === 'true',
      salePrice: req.body.salePrice || undefined,
      weight: req.body.weight || 0,

      // Gestion des tableaux
      tags: parseArrayField(req.body.tags),
      colors: parseArrayField(req.body.colors),
      sizes: parseArrayField(req.body.sizes),

      // Gestion des dimensions
      dimensions: {
        length: req.body.dimensions?.length || 0,
        width: req.body.dimensions?.width || 0,
        height: req.body.dimensions?.height || 0
      },
      // Gestion des images
      images: req.files && req.files.length > 0 ? req.files.map(file => ({
        url: '/' + file.path.replace(/\\/g, '/'), // Normaliser le chemin pour Windows
        alt: file.originalname
      })) : []
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du produit.',
      error: error.message
    });
  }
};


// Mettre à jour un produit
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erreurs de validation:', errors.array());
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({
        success: false,
        message: `Erreur de validation: ${errorMessages}`,
        errors: errors.array().map(err => ({
          param: err.param,
          msg: err.msg,
          value: err.value
        }))
      });
    }

    const { id } = req.params;

    // Vérifier si le produit existe
    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé.'
      });
    }

    // Vérifier si la catégorie existe si elle est mise à jour
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'La catégorie spécifiée n\'existe pas.'
        });
      }
    }

    // Helper pour parser les champs tableaux
    const parseArrayField = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          // Si ce n'est pas du JSON valide, on split par virgule
        }
        return value.split(',').map(item => item.trim()).filter(Boolean);
      }
      return [];
    };

    // Préparer les mises à jour
    const updateData = { ...req.body };

    // Gérer le slug si le nom est mis à jour
    if (req.body.name && req.body.name !== product.name) {
      updateData.slug = req.body.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    // Gérer les booléens
    if (req.body.isFeatured !== undefined) {
      updateData.isFeatured = req.body.isFeatured === true || req.body.isFeatured === 'true';
    }
    if (req.body.isOnSale !== undefined) {
      updateData.isOnSale = req.body.isOnSale === true || req.body.isOnSale === 'true';
    }

    // Gérer les tableaux
    if (req.body.tags) {
      updateData.tags = parseArrayField(req.body.tags);
    }
    if (req.body.colors) {
      updateData.colors = parseArrayField(req.body.colors);
    }
    if (req.body.sizes) {
      updateData.sizes = parseArrayField(req.body.sizes);
    }

    // Gérer les images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: '/' + file.path.replace(/\\/g, '/'), // Normaliser le chemin pour Windows
        alt: file.originalname
      }));
      updateData.images = [...(product.images || []), ...newImages];
    }

    // Mettre à jour le produit
    product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès.',
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du produit.',
      error: error.message
    });
  }
};

// Supprimer un produit
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le produit existe
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé.'
      });
    }

    res.json({
      success: true,
      message: 'Produit supprimé avec succès.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du produit.',
      error: error.message
    });
  }
};

// Activer/Désactiver un produit
const toggleProductActive = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le produit existe
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé.'
      });
    }

    // Inverser l'état actif
    product.isActive = !product.isActive;
    await product.save();

    res.json({
      success: true,
      message: `Produit ${product.isActive ? 'activé' : 'désactivé'} avec succès.`,
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut du produit.',
      error: error.message
    });
  }
};

// Récupérer tous les produits (Admin)
const getAdminProducts = async (req, res) => {
  try {
    const { category, featured, onSale, minPrice, maxPrice, sort, limit = 10, page = 1, search } = req.query;
    const query = {};
    const sortOptions = {};

    // Recherche textuelle
    if (search) {
      query.$text = { $search: search };
    }

    // Filtrage par catégorie
    if (category) {
      query.category = category;
    }

    // Filtrage des produits en vedette
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Filtrage des produits en promotion
    if (onSale === 'true') {
      query.isOnSale = true;
    }

    // Filtrage par prix
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Tri des résultats
    if (sort) {
      const sortFields = sort.split(',');
      sortFields.forEach(field => {
        const [key, order = 'asc'] = field.split(':');
        sortOptions[key] = order === 'desc' ? -1 : 1;
      });
    } else {
      sortOptions.createdAt = -1; // Tri par défaut par date de création décroissante
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Si limit est 'all' ou très grand, on retourne tout (pour l'admin souvent utile)
    const limitVal = limit === 'all' ? 0 : parseInt(limit);

    let productsQuery = Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOptions);

    if (limitVal > 0) {
      productsQuery = productsQuery.skip(skip).limit(limitVal);
    }

    const products = await productsQuery;
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: limitVal > 0 ? Math.ceil(total / limitVal) : 1,
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits admin.',
      error: error.message
    });
  }
};

// Récupérer tous les produits (Public)
const getProducts = async (req, res) => {
  try {
    const { category, featured, onSale, minPrice, maxPrice, sort, limit = 10, page = 1, search } = req.query;
    const query = { isActive: true };
    const sortOptions = {};

    // Recherche textuelle
    if (search) {
      query.$text = { $search: search };
    }

    // Filtrage par catégorie
    if (category) {
      query.category = category;
    }
    // ... reste du code existant de getProducts
    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (onSale === 'true') {
      query.isOnSale = true;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (sort) {
      const sortFields = sort.split(',');
      sortFields.forEach(field => {
        const [key, order = 'asc'] = field.split(':');
        sortOptions[key] = order === 'desc' ? -1 : 1;
      });
    } else {
      sortOptions.createdAt = -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits.',
      error: error.message
    });
  }
};

// Récupérer un produit par ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('category', 'name slug');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé.'
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du produit.',
      error: error.message
    });
  }
};

// Récupérer un produit par slug
const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('Recherche du produit avec le slug:', slug);

    const product = await Product.findOne({ slug }).populate('category', 'name slug');

    console.log('Résultat de la recherche:', product ? 'Produit trouvé' : 'Produit non trouvé');

    if (!product) {
      // Vérifier s'il y a des produits dans la base de données
      const allProducts = await Product.find({}, 'slug name');
      console.log('Liste de tous les slugs de produits disponibles:', allProducts.map(p => p.slug));

      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé.',
        searchedSlug: slug,
        availableSlugs: allProducts.map(p => p.slug)
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du produit.',
      error: error.message
    });
  }
};

// Produits recommandés
const getRelatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 4;

    // Récupérer le produit actuel pour obtenir sa catégorie
    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé.'
      });
    }

    // Récupérer des produits de la même catégorie (sauf le produit actuel)
    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      category: currentProduct.category,
      isActive: true
    })
      .limit(limit)
      .select('name price images slug isOnSale salePrice')
      .lean();

    res.json({
      success: true,
      data: relatedProducts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits recommandés.',
      error: error.message
    });
  }
};

// Produits populaires
const getPopularProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const popularProducts = await Product.find({ isActive: true })
      .sort({ rating: -1, numReviews: -1 })
      .limit(limit)
      .select('name price images slug isOnSale salePrice rating numReviews')
      .lean();

    res.json({
      success: true,
      data: popularProducts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits populaires.',
      error: error.message
    });
  }
};

// Produits en promotion
const getSaleProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const saleProducts = await Product.find({
      isActive: true,
      isOnSale: true
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name price images slug salePrice')
      .lean();

    res.json({
      success: true,
      data: saleProducts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits en promotion.',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductActive,
  getProductBySlug,
  getRelatedProducts,
  getPopularProducts,
  getSaleProducts,
  getAdminProducts
};