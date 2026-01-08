const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const jwtConfig = require('../config/jwt');
const { validationResult } = require('express-validator');

// Générer les tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    jwtConfig.secret,
    { expiresIn: jwtConfig.tokenExpiration }
  );

  const refreshToken = jwt.sign(
    { userId },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshTokenExpiration }
  );

  return { accessToken, refreshToken };
};

// Inscription
const register = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;
    console.log('Tentative d\'inscription pour email:', email, 'username:', username);

    // Vérifier si l'utilisateur existe
    const existingUser = await User.findOne({ 
      $or: [{ email: email.trim().toLowerCase() }, { username: username.trim() }] 
    });
    console.log('Utilisateur existant:', !!existingUser);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email ou nom d\'utilisateur est déjà utilisé.'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password
    });

    // Créer le profil
    await Profile.create({
      user: user._id,
      firstName: req.body.firstName || '',
      lastName: req.body.lastName || ''
    });

    // Générer les tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Sauvegarder le refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Inscription réussie!',
      data: {
        user: {
          _id: user._id,
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription.',
      error: error.message
    });
  }
};

// Connexion
const login = async (req, res) => {
  try {
    console.log('Tentative de connexion avec les données:', {
      email: req.body.email,
      password: req.body.password ? '***' : 'non fourni'
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erreurs de validation:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Veuillez vérifier vos informations de connexion.',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log('Recherche de l\'utilisateur avec l\'email:', email);

    // Vérifier l'utilisateur
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    console.log('Utilisateur trouvé:', user ? 'Oui' : 'Non');
    
    if (!user) {
      console.log('Aucun utilisateur trouvé avec cet email');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    // Vérifier le mot de passe
    console.log('Vérification du mot de passe...');
    const isPasswordValid = await user.comparePassword(password.trim());
    console.log('Mot de passe valide:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Mot de passe incorrect pour l\'utilisateur:', user.email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte est désactivé.'
      });
    }

    // Générer les tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Mettre à jour le dernier login et le refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Récupérer le profil
    const profile = await Profile.findOne({ user: user._id });

    res.json({
      success: true,
      message: 'Connexion réussie!',
      data: {
        user: {
          _id: user._id,
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        profile: profile || null,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion.',
      error: error.message
    });
  }
};

// Rafraîchir le token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis.'
      });
    }

    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide.'
      });
    }

    // Générer un nouveau token d'accès
    const { accessToken } = generateTokens(user._id);

    res.json({
      success: true,
      data: { accessToken }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Refresh token invalide ou expiré.',
      error: error.message
    });
  }
};

// Déconnexion
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Déconnexion réussie.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion.',
      error: error.message
    });
  }
};

// Récupérer l'utilisateur connecté
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');
    const profile = await Profile.findOne({ user: req.user.id });

    res.json({
      success: true,
      data: {
        user,
        profile
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil.',
      error: error.message
    });
  }
};

// Mettre à jour le profil
const updateProfile = async (req, res) => {
  try {
    const updates = {};
    const profileUpdates = {};

    // Mettre à jour les champs utilisateur
    if (req.body.username) updates.username = req.body.username;
    if (req.body.email) updates.email = req.body.email;

    // Mettre à jour les champs profil
    const profileFields = ['firstName', 'lastName', 'phone', 'birthDate', 'gender'];
    profileFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profileUpdates[field] = req.body[field];
      }
    });

    if (req.body.address) {
      profileUpdates.address = req.body.address;
    }

    // Mettre à jour l'utilisateur s'il y a des modifications
    if (Object.keys(updates).length > 0) {
      const existingUser = await User.findOne({
        $or: [
          { email: updates.email, _id: { $ne: req.user.id } },
          { username: updates.username, _id: { $ne: req.user.id } }
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email ou nom d\'utilisateur est déjà utilisé.'
        });
      }

      await User.findByIdAndUpdate(req.user.id, updates);
    }

    // Mettre à jour le profil
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      profileUpdates,
      { new: true, upsert: true }
    );

    const user = await User.findById(req.user.id).select('-password -refreshToken');

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès.',
      data: {
        user,
        profile
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil.',
      error: error.message
    });
  }
};

// Promouvoir un utilisateur en admin (route temporaire pour développement)
const promoteToAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    if (user.role === 'admin') {
      return res.json({
        success: true,
        message: 'L\'utilisateur est déjà administrateur.',
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role
          }
        }
      });
    }

    user.role = 'admin';
    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur promu en administrateur avec succès!',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la promotion en administrateur.',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  promoteToAdmin
};