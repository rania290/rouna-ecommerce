const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const OrderItem = require('./OrderItem');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shippingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    postalCode: String,
    country: String,
    phone: String
  },
  billingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    postalCode: String,
    country: String,
    phone: String
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    image: String,
    total: Number
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountCode: String,
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: String,
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingMethod: String,
  trackingNumber: String,
  estimatedDelivery: Date,
  notes: String,
  isGift: {
    type: Boolean,
    default: false
  },
  giftMessage: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual pour les OrderItems
orderSchema.virtual('orderItems', {
  ref: 'OrderItem',
  localField: '_id',
  foreignField: 'order'
});

// Middleware pour générer le numéro de commande
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Middleware pre-save pour marquer les nouvelles commandes
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this._isNewOrder = true;
  }
  next();
});

// Middleware post-save pour créer les OrderItems pour les nouvelles commandes
orderSchema.post('save', async function() {
  // Créer les OrderItems seulement pour les nouvelles commandes avec des items
  if (this._isNewOrder && this.items && this.items.length > 0) {
    try {
      // Vérifier si des OrderItems existent déjà pour éviter les doublons
      const existingItems = await OrderItem.find({ order: this._id });
      if (existingItems.length === 0) {
        // Créer les OrderItems
        for (const item of this.items) {
          await OrderItem.create({
            order: this._id,
            product: item.product,
            productName: item.name,
            productSlug: item.slug || (item.name ? item.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : ''),
            unitPrice: item.price,
            quantity: item.quantity,
            image: item.image || '',
            subtotal: item.price * item.quantity,
            total: item.total || (item.price * item.quantity)
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création des OrderItems:', error);
    }
  }
});

// Middleware pre-save pour mettre à jour les OrderItems si les items sont modifiés
orderSchema.pre('save', async function(next) {
  // Mettre à jour les OrderItems seulement si les items ont été modifiés et que ce n'est pas une nouvelle commande
  if (!this.isNew && this.isModified('items') && this.items && this.items.length > 0) {
    try {
      // Supprimer les anciens OrderItems
      await OrderItem.deleteMany({ order: this._id });
      
      // Créer les nouveaux OrderItems
      for (const item of this.items) {
        await OrderItem.create({
          order: this._id,
          product: item.product,
          productName: item.name,
          productSlug: item.slug || (item.name ? item.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : ''),
          unitPrice: item.price,
          quantity: item.quantity,
          image: item.image || '',
          subtotal: item.price * item.quantity,
          total: item.total || (item.price * item.quantity)
        });
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Méthode pour calculer les totaux
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.total = this.subtotal + this.shippingCost + this.tax - this.discount;
  return this.total;
};

// Ajouter le plugin de pagination
orderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Order', orderSchema);