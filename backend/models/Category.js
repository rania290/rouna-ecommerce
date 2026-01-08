const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la catégorie est requis'],
    trim: true,
    unique: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  image: {
    type: String,
    default: 'default-category.jpg'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0,
    min: 0
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [70, 'Le meta title ne peut pas dépasser 70 caractères']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'La meta description ne peut pas dépasser 160 caractères']
  },
  metaKeywords: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual pour les sous-catégories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual pour les produits
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  match: { isActive: true }
});

// Virtual pour le nombre de produits
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true,
  match: { isActive: true }
});

// Index pour les recherches
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ parent: 1, displayOrder: 1 });
categorySchema.index({ isActive: 1 });

// Middleware pour générer le slug avant sauvegarde
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true
    });
  }
  next();
});

// Middleware pour peupler les sous-catégories
categorySchema.pre(/^find/, function(next) {
  this.populate({
    path: 'subcategories',
    select: 'name slug description image isActive displayOrder',
    options: { sort: { displayOrder: 1 } }
  });
  next();
});

// Méthode statique pour obtenir l'arborescence complète
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.aggregate([
    {
      $graphLookup: {
        from: 'categories',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parent',
        as: 'children',
        depthField: 'depth',
        restrictSearchWithMatch: { isActive: true }
      }
    },
    {
      $match: {
        parent: null,
        isActive: true
      }
    },
    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        image: 1,
        displayOrder: 1,
        children: {
          $map: {
            input: '$children',
            as: 'child',
            in: {
              name: '$$child.name',
              slug: '$$child.slug',
              description: '$$child.description',
              image: '$$child.image',
              displayOrder: '$$child.displayOrder',
              depth: '$$child.depth'
            }
          }
        }
      }
    },
    { $sort: { displayOrder: 1 } }
  ]);
  
  return categories;
};

// Méthode pour obtenir tous les produits d'une catégorie (incluant les sous-catégories)
categorySchema.methods.getAllProducts = async function() {
  // Récupérer tous les IDs de catégories (incluant les sous-catégories)
  const categoryIds = await this.model('Category').aggregate([
    {
      $match: {
        $or: [
          { _id: this._id },
          { parent: this._id }
        ]
      }
    },
    {
      $graphLookup: {
        from: 'categories',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parent',
        as: 'allChildren'
      }
    },
    {
      $project: {
        allIds: {
          $concatArrays: [
            ['$_id'],
            '$allChildren._id'
          ]
        }
      }
    },
    { $unwind: '$allIds' },
    { $group: { _id: null, ids: { $addToSet: '$allIds' } } }
  ]);

  if (categoryIds.length > 0) {
    const Product = mongoose.model('Product');
    return await Product.find({
      category: { $in: categoryIds[0].ids },
      isActive: true
    }).populate('category');
  }
  
  return [];
};

// Méthode pour obtenir les statistiques de la catégorie
categorySchema.methods.getStats = async function() {
  const Product = mongoose.model('Product');
  
  const stats = await Product.aggregate([
    {
      $match: {
        category: this._id,
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        averagePrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        totalStock: { $sum: '$stock' },
        productsOnSale: {
          $sum: { $cond: [{ $eq: ['$isOnSale', true] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalProducts: 0,
    averagePrice: 0,
    minPrice: 0,
    maxPrice: 0,
    totalStock: 0,
    productsOnSale: 0
  };
};

// Méthode pour désactiver une catégorie et tous ses produits
categorySchema.methods.deactivateWithProducts = async function() {
  this.isActive = false;
  await this.save();

  // Désactiver tous les produits de cette catégorie
  const Product = mongoose.model('Product');
  await Product.updateMany(
    { category: this._id },
    { $set: { isActive: false } }
  );

  // Désactiver les sous-catégories
  await this.model('Category').updateMany(
    { parent: this._id },
    { $set: { isActive: false } }
  );

  return this;
};

module.exports = mongoose.model('Category', categorySchema);