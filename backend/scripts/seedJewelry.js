require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const mongoose = require('mongoose')
const slugify = require('slugify')

const Category = require('../models/Category')
const Product = require('../models/Product')

async function connect() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rouna'
  await mongoose.connect(uri)
  console.log(`✅ Connecté à MongoDB: ${uri}`)
}

async function upsertCategory(name, description = '', parent = null, image = '') {
  const existing = await Category.findOne({ name })
  if (existing) {
    existing.description = description
    existing.isActive = true
    existing.parent = parent
    if (image) existing.image = image
    await existing.save()
    console.log(`↺ Catégorie mise à jour: ${name}`)
    return existing
  }

  const category = new Category({ name, description, parent, image })
  await category.save()
  console.log(`➕ Catégorie créée: ${name}`)
  return category
}

async function removeCategories(names = []) {
  if (!names.length) return
  const cats = await Category.find({ name: { $in: names } })
  if (!cats.length) return console.log('ℹ️ Aucune catégorie à supprimer.')

  const catIds = cats.map((c) => c._id)
  await Product.updateMany({ category: { $in: catIds } }, { $set: { isActive: false } })
  await Category.deleteMany({ _id: { $in: catIds } })
  console.log(`🗑️  Catégories supprimées: ${names.join(', ')} (produits associés désactivés)`)
}

async function upsertProduct(data) {
  const { slug, name } = data
  const existing = await Product.findOne({ slug })
  if (existing) {
    Object.assign(existing, data)
    await existing.save()
    console.log(`↺ Produit mis à jour: ${name}`)
    return existing
  }

  const product = new Product(data)
  await product.save()
  console.log(`➕ Produit créé: ${name}`)
  return product
}

async function seed() {
  await connect()

  // Créer/activer les catégories principales (sans parent "Bijoux")
  const categories = await Promise.all([
    upsertCategory(
      'Colliers',
      'Sélection de colliers élégants',
      null,
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'
    ),
    upsertCategory(
      'Bagues',
      'Bagues raffinées et modernes',
      null,
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'
    ),
    upsertCategory(
      'Gourmettes',
      'Gourmettes et bracelets de caractère',
      null,
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1200&q=80'
    ),
    // Nouvelle catégorie Bracelets
    upsertCategory(
      'Bracelets',
      'Bracelets élégants pour tous les styles',
      null,
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1200&q=80'
    ),
  ])

  // Supprimer les catégories à retirer + désactiver leurs produits
  await removeCategories(['Montres', 'Sacs', 'Bijoux'])

  const categoryMap = Object.fromEntries(categories.map((cat) => [cat.name, cat._id]))

  // Produits de démonstration
  const localImg1 = '/uploads/products/collier.jpg'
  const localImg2 = '/uploads/products/bague.jpg'
  const localImg3 = '/uploads/products/Gourmette.jpg'
  const localImg4 = '/uploads/products/braclets.jpg'

  const demoProducts = [
    {
      name: 'Collier Éclat Améthyste',
      slug: slugify('Collier Éclat Améthyste', { lower: true, strict: true }),
      description: 'Collier en argent sterling avec pendentif améthyste taille ovale.',
      shortDescription: 'Élégance violette, finition polie.',
      price: 129,
      compareAtPrice: 159,
      stock: 25,
      category: categoryMap['Colliers'],
      tags: ['collier', 'argent', 'améthyste'],
      materials: ['Argent 925', 'Améthyste'],
      colors: ['Argent', 'Violet'],
      isFeatured: true,
      isOnSale: true,
      salePercentage: 15,
      images: [
        {
          url: localImg1,
          altText: 'Collier améthyste',
          isMain: true,
        },
      ],
    },
    {
      name: 'Bague Halo Quartz Rose',
      slug: slugify('Bague Halo Quartz Rose', { lower: true, strict: true }),
      description: 'Bague en plaqué or rose avec quartz rose central et halo de zirconiums.',
      shortDescription: 'Délicate et romantique.',
      price: 89,
      compareAtPrice: 109,
      stock: 40,
      category: categoryMap['Bagues'],
      tags: ['bague', 'or rose', 'quartz'],
      materials: ['Plaqué or rose', 'Quartz rose', 'Zirconium'],
      colors: ['Or rose', 'Rose pâle'],
      isFeatured: true,
      isOnSale: false,
      images: [
        {
          url: localImg2,
          altText: 'Bague quartz rose',
          isMain: true,
        },
      ],
    },
    {
      name: 'Gourmette Acier Minimaliste',
      slug: slugify('Gourmette Acier Minimaliste', { lower: true, strict: true }),
      description: 'Gourmette en acier inoxydable brossé, maillons plats, longueur ajustable.',
      shortDescription: 'Style épuré, résistant à l’eau.',
      price: 59,
      stock: 60,
      category: categoryMap['Gourmettes'],
      tags: ['gourmette', 'acier', 'bracelet'],
      materials: ['Acier inoxydable'],
      colors: ['Acier'],
      isFeatured: false,
      isOnSale: false,
      images: [
        {
          url: localImg3,
          altText: 'Gourmette acier',
          isMain: true,
        },
      ],
    },
    // Nouveau produit Bracelet
    {
      name: 'Bracelet Cuir Tressé Argent',
      slug: slugify('Bracelet Cuir Tressé Argent', { lower: true, strict: true }),
      description: 'Bracelet en cuir véritable tressé avec fermoir en argent sterling.',
      shortDescription: 'Style bohème et raffiné.',
      price: 79,
      compareAtPrice: 99,
      stock: 35,
      category: categoryMap['Bracelets'],
      tags: ['bracelet', 'cuir', 'argent', 'tressé'],
      materials: ['Cuir véritable', 'Argent 925'],
      colors: ['Brun', 'Argent'],
      isFeatured: true,
      isOnSale: true,
      salePercentage: 20,
      images: [
        {
          url: localImg4,
          altText: 'Bracelet cuir et argent',
          isMain: true,
        },
      ],
    },
  ]

  for (const product of demoProducts) {
    await upsertProduct(product)
  }

  console.log('🎉 Seed bijoux terminé avec ajout des bracelets.')
  await mongoose.connection.close()
  process.exit(0)
}

seed().catch((err) => {
  console.error('Erreur lors du seed bijoux:', err)
  mongoose.connection.close()
  process.exit(1)
})
