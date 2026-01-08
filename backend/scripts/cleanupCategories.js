require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const mongoose = require('mongoose')
const Category = require('../models/Category')

async function cleanup() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rouna'
        await mongoose.connect(uri)
        console.log('✅ Connecté à MongoDB')

        const result = await Category.deleteMany({
            name: { $regex: /^bijoux$|^jewelry$/i }
        })

        console.log(`🗑️  Catégories supprimées: ${result.deletedCount}`)

        await mongoose.connection.close()
        process.exit(0)
    } catch (error) {
        console.error('❌ Erreur:', error)
        process.exit(1)
    }
}

cleanup()
