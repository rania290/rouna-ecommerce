const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  isMain: {
    type: Boolean,
    default: false
  },
  publicId: String
}, { _id: false });

const dimensionSchema = new mongoose.Schema({
  length: {
    type: Number,
    default: 0,
    min: 0
  },
  width: {
    type: Number,
    default: 0,
    min: 0
  },
  height: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  // Informations de base
  name: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true,
    minlength: [3, 'Le nom doit contenir au moins 3 caractères'],
    maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    minlength: [10, 'La description doit contenir au moins 10 caractères']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'La description courte ne peut pas dépasser 500 caractères'],
    default: ''
  },
  
  // Prix et stock
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  salePrice: {
    type: Number,
    min: [0, 'Le prix soldé ne peut pas être négatif'],
    validate: {
      validator: function(value) {
        return value < this.price;
      },
      message: 'Le prix soldé doit être inférieur au prix normal'
    }
  },
  costPrice: {
    type: Number,
    min: [0, 'Le prix de revient ne peut pas être négatif']
  },
  stock: {
    type: Number,
    required: [true, 'La quantité en stock est requise'],
    default: 0,
    min: [0, 'Le stock ne peut pas être négatif'],
    set: function(v) { return Math.round(v); } // S'assurer que c'est un entier
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  
  // Catégorie et marque
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La catégorie est requise']
  },
  brand: {
    type: String,
    trim: true
  },
  
  // Images
  images: {
    type: [imageSchema],
    default: []
  },
  
  // Caractéristiques physiques
  weight: {
    type: Number,
    min: [0, 'Le poids ne peut pas être négatif'],
    default: 0
  },
  dimensions: {
    type: dimensionSchema,
    default: () => ({})
  },
  
  // Taxonomie et attributs
  tags: {
    type: [String],
    default: []
  },
  colors: {
    type: [String],
    default: []
  },
  sizes: {
    type: [String],
    default: []
  },
  
  // Statuts et drapeaux
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  salePercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  meta: {
    title: String,
    description: String,
    keywords: [String]
  },
  seo: {
    friendlyUrl: String,
    metaDescription: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual pour récupérer les avis
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product'
});

// Index pour les recherches
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1, isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'rating.average': -1 });

// Middleware pour calculer le prix de vente
productSchema.pre('save', function(next) {
  if (this.isOnSale && this.salePercentage > 0) {
    this.salePrice = this.price - (this.price * this.salePercentage / 100);
  } else if (this.isOnSale && this.compareAtPrice) {
    this.salePrice = this.price;
  } else {
    this.salePrice = null;
  }
  next();
});

// Ajouter le plugin de pagination
productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', productSchema);