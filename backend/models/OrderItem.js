const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productSlug: {
    type: String,
    required: true,
    lowercase: true
  },
  sku: String,
  barcode: String,
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0
  },
  regularPrice: {
    type: Number,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 999
  },
  weight: {
    type: Number,
    default: 0,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  color: String,
  size: String,
  material: String,
  image: {
    type: String,
    default: ''
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  downloadLink: String,
  downloadExpires: Date,
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  warrantyPeriod: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'months', 'years'],
      default: 'months'
    }
  },
  warrantyExpires: Date,
  returnDeadline: Date,
  isReturnable: {
    type: Boolean,
    default: true
  },
  returnReason: String,
  returnStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected', 'completed', 'refunded'],
    default: 'none'
  },
  returnRequestDate: Date,
  returnApprovedDate: Date,
  returnCompletedDate: Date,
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    maxlength: 500
  },
  customizations: [{
    option: String,
    value: String,
    additionalCost: {
      type: Number,
      default: 0
    }
  }],
  giftWrap: {
    isGiftWrapped: {
      type: Boolean,
      default: false
    },
    wrapType: String,
    wrapCost: {
      type: Number,
      default: 0
    },
    giftMessage: String
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual pour le prix effectif
orderItemSchema.virtual('effectivePrice').get(function() {
  return this.salePrice || this.unitPrice;
});

// Virtual pour le calcul du total avant taxes et réductions
orderItemSchema.virtual('lineTotal').get(function() {
  return this.effectivePrice * this.quantity;
});

// Virtual pour le produit (populé)
orderItemSchema.virtual('productDetails', {
  ref: 'Product',
  localField: 'product',
  foreignField: '_id',
  justOne: true
});

// Virtual pour les reviews de ce produit par le client
orderItemSchema.virtual('review', {
  ref: 'Review',
  localField: 'product',
  foreignField: 'product',
  justOne: true,
  match: { user: { $eq: null } } // À remplacer par l'ID utilisateur réel
});

// Index pour les recherches
orderItemSchema.index({ order: 1, product: 1 });
orderItemSchema.index({ product: 1, 'returnStatus': 1 });
orderItemSchema.index({ 'returnDeadline': 1 });
orderItemSchema.index({ 'warrantyExpires': 1 });

// Middleware pour calculer les totaux avant sauvegarde
orderItemSchema.pre('save', function(next) {
  // Calculer le sous-total (prix unitaire * quantité)
  this.subtotal = this.unitPrice * this.quantity;
  
  // Calculer la réduction
  if (this.discountRate > 0) {
    this.discountAmount = this.subtotal * (this.discountRate / 100);
  }
  
  // Calculer les taxes
  if (this.taxRate > 0) {
    this.taxAmount = (this.subtotal - this.discountAmount) * (this.taxRate / 100);
  }
  
  // Calculer le total
  this.total = this.subtotal - this.discountAmount + this.taxAmount;
  
  // Si cadeau emballé, ajouter le coût
  if (this.giftWrap && this.giftWrap.isGiftWrapped) {
    this.total += this.giftWrap.wrapCost;
  }
  
  // Ajouter le coût des personnalisations
  if (this.customizations && this.customizations.length > 0) {
    const customizationCost = this.customizations.reduce(
      (sum, item) => sum + (item.additionalCost || 0), 0
    );
    this.total += customizationCost;
  }
  
  next();
});

// Middleware pour mettre à jour le stock après création
orderItemSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  
  // Décrémenter le stock
  await Product.findByIdAndUpdate(this.product, {
    $inc: { stock: -this.quantity }
  });
});

// Middleware pour restaurer le stock après suppression
orderItemSchema.post('remove', async function() {
  const Product = mongoose.model('Product');
  
  // Restaurer le stock
  await Product.findByIdAndUpdate(this.product, {
    $inc: { stock: this.quantity }
  });
});

// Méthode pour vérifier si l'article peut être retourné
orderItemSchema.methods.canBeReturned = function() {
  if (!this.isReturnable) return false;
  if (this.returnDeadline && new Date() > this.returnDeadline) return false;
  if (this.returnStatus !== 'none') return false;
  
  // Vérifier si le produit est numérique
  if (this.isDigital) return false;
  
  return true;
};

// Méthode pour demander un retour
orderItemSchema.methods.requestReturn = async function(reason) {
  if (!this.canBeReturned()) {
    throw new Error('Cet article ne peut pas être retourné');
  }
  
  this.returnStatus = 'requested';
  this.returnReason = reason;
  this.returnRequestDate = new Date();
  
  // Définir la date limite de retour (30 jours par défaut)
  if (!this.returnDeadline) {
    this.returnDeadline = new Date();
    this.returnDeadline.setDate(this.returnDeadline.getDate() + 30);
  }
  
  return await this.save();
};

// Méthode pour approuver un retour
orderItemSchema.methods.approveReturn = async function() {
  if (this.returnStatus !== 'requested') {
    throw new Error('Seuls les retours demandés peuvent être approuvés');
  }
  
  this.returnStatus = 'approved';
  this.returnApprovedDate = new Date();
  
  // Calculer le montant du remboursement (total payé)
  this.refundAmount = this.total;
  
  return await this.save();
};

// Méthode pour compléter un retour
orderItemSchema.methods.completeReturn = async function() {
  if (this.returnStatus !== 'approved') {
    throw new Error('Seuls les retours approuvés peuvent être complétés');
  }
  
  this.returnStatus = 'completed';
  this.returnCompletedDate = new Date();
  
  // Restaurer le stock
  const Product = mongoose.model('Product');
  await Product.findByIdAndUpdate(this.product, {
    $inc: { stock: this.quantity }
  });
  
  return await this.save();
};

// Méthode pour vérifier la garantie
orderItemSchema.methods.isUnderWarranty = function() {
  if (!this.warrantyExpires) return false;
  return new Date() <= this.warrantyExpires;
};

// Méthode pour calculer les jours restants de garantie
orderItemSchema.methods.getWarrantyDaysLeft = function() {
  if (!this.isUnderWarranty()) return 0;
  
  const now = new Date();
  const expiry = this.warrantyExpires;
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Méthode pour obtenir les détails formatés
orderItemSchema.methods.getFormattedDetails = function() {
  return {
    productName: this.productName,
    quantity: this.quantity,
    unitPrice: this.unitPrice.toFixed(2),
    salePrice: this.salePrice ? this.salePrice.toFixed(2) : null,
    subtotal: this.subtotal.toFixed(2),
    discount: this.discountAmount > 0 ? this.discountAmount.toFixed(2) : null,
    tax: this.taxAmount.toFixed(2),
    total: this.total.toFixed(2),
    image: this.image,
    color: this.color,
    size: this.size,
    isReturnable: this.isReturnable,
    isUnderWarranty: this.isUnderWarranty(),
    warrantyDaysLeft: this.getWarrantyDaysLeft()
  };
};

// Méthode statique pour obtenir les articles les plus vendus
orderItemSchema.statics.getBestSellers = async function(limit = 10, days = 30) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  const bestSellers = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: dateLimit }
      }
    },
    {
      $group: {
        _id: '$product',
        totalQuantity: { $sum: '$quantity' },
        totalRevenue: { $sum: '$total' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' },
    {
      $match: {
        'productDetails.isActive': true
      }
    },
    {
      $project: {
        productId: '$_id',
        productName: '$productDetails.name',
        productSlug: '$productDetails.slug',
        productImage: { $arrayElemAt: ['$productDetails.images.url', 0] },
        totalQuantity: 1,
        totalRevenue: 1,
        orderCount: 1,
        averageRevenuePerOrder: { $divide: ['$totalRevenue', '$orderCount'] }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit }
  ]);

  return bestSellers;
};

module.exports = mongoose.model('OrderItem', orderItemSchema);