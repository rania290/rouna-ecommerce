const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const pdfService = require('../services/pdfService');

// Créer une commande
const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      shippingAddress,
      billingAddress,
      items,
      shippingMethod,
      paymentMethod,
      discountCode,
      notes
    } = req.body;

    // Vérifier et préparer les items
    let orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produit non trouvé: ${item.productId}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${product.name}. Disponible: ${product.stock}`
        });
      }

      const price = product.isOnSale && product.salePrice
        ? product.salePrice
        : product.price;

      const itemTotal = price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: price,
        quantity: item.quantity,
        image: product.images.find(img => img.isMain)?.url || product.images[0]?.url,
        total: itemTotal
      });

      subtotal += itemTotal;

      // Réserver le stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Calculer les frais de livraison (exemple simple)
    let shippingCost = 0;
    if (shippingMethod === 'express') {
      shippingCost = 15;
    } else if (shippingMethod === 'standard') {
      shippingCost = 5;
    }

    // Calculer la TVA (exemple 20%)
    const tax = subtotal * 0.20;

    // Appliquer une réduction si code valide
    let discount = 0;
    if (discountCode === 'ROUNA10') {
      discount = subtotal * 0.10;
    }

    // Calculer le total
    const total = subtotal + shippingCost + tax - discount;

    // Créer la commande
    const order = await Order.create({
      user: req.user.id,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      items: orderItems,
      subtotal,
      shippingCost,
      tax,
      discount,
      discountCode: discount > 0 ? discountCode : null,
      total,
      paymentMethod,
      shippingMethod,
      notes
    });

    // Générer le PDF du ticket de commande
    let pdfData = null;
    try {
      const pdfBuffer = await pdfService.generateOrderTicket(order);
      pdfData = pdfBuffer.toString('base64');
    } catch (pdfError) {
      console.error('Erreur lors de la génération du PDF:', pdfError);
      // Ne pas échouer la commande si le PDF échoue
    }

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès.',
      data: {
        order,
        pdf: pdfData ? {
          data: pdfData,
          filename: `ticket-commande-${order._id}.pdf`,
          contentType: 'application/pdf'
        } : null
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande.',
      error: error.message
    });
  }
};

// Récupérer les commandes d'un utilisateur
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user.id };
    if (status) {
      query.orderStatus = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: '-createdAt'
    };

    const orders = await Order.paginate(query, options);

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes.',
      error: error.message
    });
  }
};

// Récupérer toutes les commandes (admin)
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      startDate,
      endDate,
      userId
    } = req.query;

    const query = {};

    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (userId) query.user = userId;

    // Filtrer par date
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: '-createdAt',
      populate: 'user'
    };

    const orders = await Order.paginate(query, options);

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes.',
      error: error.message
    });
  }
};

// Récupérer une commande par ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'username email')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée.'
      });
    }

    // Vérifier que l'utilisateur peut voir cette commande
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès à cette commande.'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande.',
      error: error.message
    });
  }
};

// Mettre à jour le statut d'une commande (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, trackingNumber } = req.body;

    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user', 'username email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée.'
      });
    }

    res.json({
      success: true,
      message: 'Statut de commande mis à jour.',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut.',
      error: error.message
    });
  }
};

// Annuler une commande
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée.'
      });
    }

    // Vérifier que l'utilisateur peut annuler cette commande
    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas annuler cette commande.'
      });
    }

    // Vérifier si l'annulation est possible
    if (!['pending', 'processing'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Cette commande ne peut plus être annulée.'
      });
    }

    // Restituer le stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    // Marquer comme annulée
    order.orderStatus = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Commande annulée avec succès.',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la commande.',
      error: error.message
    });
  }
};

// Statistiques des commandes (admin)
const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Commandes du jour
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) }
    });

    // Commandes du mois
    const monthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Commandes de l'année
    const yearOrders = await Order.countDocuments({
      createdAt: { $gte: startOfYear }
    });

    // Revenus du mois
    const monthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    // Commandes par statut
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Produits les plus vendus
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    // Total produits et utilisateurs
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      data: {
        todayOrders,
        monthOrders,
        yearOrders,
        monthRevenue: monthRevenue[0]?.total || 0,
        ordersByStatus,
        topProducts,
        totalProducts,
        totalUsers
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques.',
      error: error.message
    });
  }
};

// Télécharger le PDF d'un ticket de commande
const downloadOrderPDF = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée.'
      });
    }

    // Vérifier que l'utilisateur peut accéder à cette commande
    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès à cette commande.'
      });
    }

    // Générer le PDF
    const pdfBuffer = await pdfService.generateOrderTicket(order);

    // Définir les en-têtes pour le téléchargement
    const filename = `ticket-commande-${order._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Envoyer le PDF
    res.send(pdfBuffer);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF.',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  downloadOrderPDF
};
