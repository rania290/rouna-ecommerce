require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');

async function initSystem() {
  console.log('🚀 INITIALISATION DU SYSTÈME\n');

  try {
    // Connexion MongoDB
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connecté à MongoDB\n');
    } catch (dbError) {
      console.error('❌ Erreur de connexion MongoDB:', dbError.message);
      console.error('Impossible d\'initialiser le système sans base de données.\n');
      return;
    }

    // 1. Créer un admin par défaut si aucun n'existe
    console.log('1️⃣ Vérification/Création de l\'admin...');
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (!existingAdmin) {
      const admin = await User.create({
        email: 'admin@rouna.com',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });

      await Profile.create({
        user: admin._id,
        firstName: 'Admin',
        lastName: 'System'
      });

      console.log('✅ Admin créé:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Mot de passe: admin123`);
      console.log(`   Rôle: ${admin.role}\n`);
    } else {
      console.log('✅ Admin déjà existant\n');
    }

    // 2. Créer un utilisateur test si aucun n'existe
    console.log('2️⃣ Vérification/Création d\'un utilisateur test...');
    const existingUser = await User.findOne({ role: 'user' });

    if (!existingUser) {
      const testUser = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'test123',
        role: 'user',
        isActive: true
      });

      await Profile.create({
        user: testUser._id,
        firstName: 'Test',
        lastName: 'User'
      });

      console.log('✅ Utilisateur test créé:');
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Mot de passe: test123\n`);
    } else {
      console.log('✅ Utilisateur test déjà existant\n');
    }

    // 3. Alimenter avec des produits de base
    console.log('3️⃣ Création de produits de test...');
    const Product = require('../models/Product');
    const Category = require('../models/Category');

    // Créer une catégorie de base
    let category = await Category.findOne({ name: 'Bijoux' });
    if (!category) {
      category = await Category.create({
        name: 'Bijoux',
        description: 'Collection de bijoux',
        isActive: true
      });
      console.log('✅ Catégorie créée\n');
    }

    // Créer quelques produits de test
    const existingProducts = await Product.countDocuments();
    if (existingProducts === 0) {
      const testProducts = [
        {
          name: 'Collier Test',
          slug: 'collier-test',
          description: 'Collier de test pour vérifier le système',
          shortDescription: 'Collier test',
          price: 50,
          stock: 10,
          category: category._id,
          images: [{
            url: '/uploads/products/test-image.jpg',
            altText: 'Image test',
            isMain: true
          }],
          isActive: true
        },
        {
          name: 'Bague Test',
          slug: 'bague-test',
          description: 'Bague de test pour vérifier le système',
          shortDescription: 'Bague test',
          price: 30,
          stock: 5,
          category: category._id,
          images: [{
            url: '/uploads/products/test-image2.jpg',
            altText: 'Image test 2',
            isMain: true
          }],
          isActive: true
        }
      ];

      for (const productData of testProducts) {
        await Product.create(productData);
      }

      console.log('✅ Produits de test créés\n');
    } else {
      console.log('✅ Produits déjà existants\n');
    }

    await mongoose.disconnect();

    console.log('🎉 INITIALISATION TERMINÉE !');
    console.log('\n📋 COMPTE DE TEST:');
    console.log('   Admin: admin@rouna.com / admin123');
    console.log('   User: test@example.com / test123');
    console.log('\n🚀 Démarrer les serveurs:');
    console.log('   Backend: npm run dev');
    console.log('   Frontend: cd ../frontend && npm run dev');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  }
}

initSystem();
