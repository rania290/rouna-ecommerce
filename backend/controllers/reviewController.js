const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');

// Créer un avis
const createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { productId, rating, title, comment } = req.body;

    // Vérifier si l'utilisateur a acheté ce produit
    const hasPurchased = await Order.exists({
      user: req.user.id,
      'items.product': productId,
      orderStatus: 'delivered'
    });

    // Vérifier si l'utilisateur a déjà posté un avis pour ce produit
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà posté un avis pour ce produit.'
      });
    }

    // Créer l'avis
    const review = await Review.create({
      user: req.user.id,
      product: productId,
      rating,
      title,
      comment,
      isVerifiedPurchase: hasPurchased,
      isApproved: !hasPurchased // Approuver automatiquement si achat vérifié
    });

    res.status(201).json({
      success: true,
      message: 'Avis créé avec succès.',
      data: review
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà posté un avis pour ce produit.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'avis.',
      error: error.message
    });
  }
};

// Récupérer les avis d'un produit
const getProductReviews = async (req, res) => {
  try {
    console.log('Récupération des avis pour le produit ID:', req.params.productId);
    const { page = 1, limit = 10, rating, sort = '-createdAt' } = req.query;

    const query = { 
      product: req.params.productId,
      isApproved: true 
    };

    console.log('Requête de recherche des avis:', query);

    if (rating) {
      query.rating = parseInt(rating);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: {
        path: 'user',
        select: 'username'
      }
    };

    const reviews = await Review.paginate(query, options);

    // Calculer les statistiques des notes
    const ratingStats = await Review.aggregate([
      { $match: { product: req.params.productId, isApproved: true } },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 },
          distribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    let stats = {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (ratingStats.length > 0) {
      stats.average = Math.round(ratingStats[0].average * 10) / 10;
      stats.count = ratingStats[0].count;
      
      // Calculer la distribution
      ratingStats[0].distribution.forEach(rating => {
        stats.distribution[rating]++;
      });
    }

    res.json({
      success: true,
      data: {
        reviews,
        stats
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis.',
      error: error.message
    });
  }
};

// Récupérer les avis d'un utilisateur
const getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const query = { user: req.user.id };
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: '-createdAt',
      populate: {
        path: 'product',
        select: 'name images'
      }
    };

    const reviews = await Review.paginate(query, options);

    res.json({
      success: true,
      data: reviews
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis.',
      error: error.message
    });
  }
};

// Mettre à jour un avis
const updateReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé.'
      });
    }

    // Vérifier que l'utilisateur peut modifier cet avis
    if (req.user.role !== 'admin' && review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas modifier cet avis.'
      });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'username');

    res.json({
      success: true,
      message: 'Avis mis à jour avec succès.',
      data: updatedReview
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'avis.',
      error: error.message
    });
  }
};

// Supprimer un avis
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé.'
      });
    }

    // Vérifier que l'utilisateur peut supprimer cet avis
    if (req.user.role !== 'admin' && review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer cet avis.'
      });
    }

    await review.remove();

    res.json({
      success: true,
      message: 'Avis supprimé avec succès.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'avis.',
      error: error.message
    });
  }
};

// Marquer un avis comme utile
const markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé.'
      });
    }

    // Vérifier si l'utilisateur a déjà marqué comme utile
    const alreadyHelpful = review.helpful.users.some(
      userId => userId.toString() === req.user.id
    );

    if (alreadyHelpful) {
      // Retirer le vote
      review.helpful.count -= 1;
      review.helpful.users = review.helpful.users.filter(
        userId => userId.toString() !== req.user.id
      );
    } else {
      // Ajouter le vote
      review.helpful.count += 1;
      review.helpful.users.push(req.user.id);
    }

    await review.save();

    res.json({
      success: true,
      message: alreadyHelpful 
        ? 'Vote retiré avec succès.' 
        : 'Avis marqué comme utile.',
      data: {
        count: review.helpful.count,
        userVoted: !alreadyHelpful
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du vote.',
      error: error.message
    });
  }
};

// Approuver/désapprouver un avis (admin)
const toggleReviewApproval = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'username')
      .populate('product', 'name');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé.'
      });
    }

    review.isApproved = !review.isApproved;
    await review.save();

    res.json({
      success: true,
      message: `Avis ${review.isApproved ? 'approuvé' : 'désapprouvé'} avec succès.`,
      data: review
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de l\'avis.',
      error: error.message
    });
  }
};

// Répondre à un avis (admin)
const addAdminResponse = async (req, res) => {
  try {
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'La réponse est requise.'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé.'
      });
    }

    review.adminResponse = {
      comment: response,
      respondedAt: new Date(),
      respondedBy: req.user.id
    };

    await review.save();

    res.json({
      success: true,
      message: 'Réponse ajoutée avec succès.',
      data: review
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la réponse.',
      error: error.message
    });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
  toggleReviewApproval,
  addAdminResponse
};