const Category = require('../models/Category');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Créer une catégorie
const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Générer le slug
    const slug = req.body.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');

    const category = await Category.create({
      ...req.body,
      slug
    });

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès.',
      data: category
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Une catégorie avec ce nom existe déjà.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie.',
      error: error.message
    });
  }
};

// Récupérer toutes les catégories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('subcategories')
      .sort('displayOrder');

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories.',
      error: error.message
    });
  }
};

// Récupérer une catégorie par ID
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('subcategories')
      .populate('products');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée.'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie.',
      error: error.message
    });
  }
};

// Récupérer une catégorie par slug
const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
      .populate('subcategories');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée.'
      });
    }

    // Récupérer les produits de cette catégorie
    const products = await Product.find({
      category: category._id,
      isActive: true
    }).populate('category');

    res.json({
      success: true,
      data: {
        category,
        products
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie.',
      error: error.message
    });
  }
};

// Mettre à jour une catégorie
const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let updateData = { ...req.body };
    
    // Mettre à jour le slug si le nom change
    if (req.body.name) {
      updateData.slug = req.body.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée.'
      });
    }

    res.json({
      success: true,
      message: 'Catégorie mise à jour avec succès.',
      data: category
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Une catégorie avec ce nom existe déjà.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la catégorie.',
      error: error.message
    });
  }
};

// Supprimer une catégorie
const deleteCategory = async (req, res) => {
  try {
    // Vérifier s'il y a des produits dans cette catégorie
    const productsCount = await Product.countDocuments({ category: req.params.id });
    
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer cette catégorie car elle contient des produits.'
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée.'
      });
    }

    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie.',
      error: error.message
    });
  }
};

// Catégories avec sous-catégories
const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $graphLookup: {
          from: 'categories',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parent',
          as: 'children',
          depthField: 'depth'
        }
      },
      { $match: { parent: null } },
      { $sort: { displayOrder: 1 } }
    ]);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'arborescence des catégories.',
      error: error.message
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  getCategoryTree
};