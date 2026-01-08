# Rouna - E-commerce de Bijoux avec IA

Frontend moderne et élégant pour la plateforme e-commerce Rouna, spécialisée dans les accessoires de mode et bijoux avec intégration d'intelligence artificielle avancée.

## 🚀 Fonctionnalités

### Interface Utilisateur
- ✅ Design moderne et élégant avec Tailwind CSS
- ✅ Interface responsive (mobile, tablette, desktop)
- ✅ Animations fluides avec Framer Motion
- ✅ Navigation intuitive et expérience utilisateur optimale

### Fonctionnalités E-commerce
- ✅ Catalogue de produits avec filtres avancés et recherche
- ✅ Détails de produits avec galerie d'images haute qualité
- ✅ Panier d'achat persistant avec synchronisation
- ✅ Processus de commande complet avec validation
- ✅ **Génération automatique de tickets PDF** pour les commandes
- ✅ Système de wishlist personnalisé
- ✅ Gestion de profil utilisateur complète
- ✅ Historique des commandes avec détails

### Intégration IA Avancée
- ✅ **Recherche intelligente** : Recherche assistée par IA avec suggestions contextuelles
- ✅ **Recommandations personnalisées** : Suggestions de produits basées sur l'historique utilisateur
- ✅ **Chatbot assistant** : Assistant virtuel pour aider les clients en temps réel
- ✅ **Recommandations de style** : Suggestions basées sur les préférences et tendances
- ✅ **Analyse de produits** : Intelligence artificielle pour l'analyse des descriptions

### Administration Complète
- ✅ Tableau de bord administrateur avec statistiques
- ✅ Gestion complète des produits (CRUD)
- ✅ Gestion des commandes et statuts
- ✅ Gestion des catégories (Colliers, Bagues, Gourmettes, Bracelets)

## 🛠️ Technologies

- **React 18** - Bibliothèque UI
- **Vite** - Build tool et dev server
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Axios** - Requêtes HTTP
- **React Hot Toast** - Notifications
- **Zustand** - State management (optionnel)

## 📦 Installation

1. Installer les dépendances :
```bash
npm install
```

2. Créer un fichier `.env` à la racine du projet :
```env
VITE_API_URL=http://localhost:5000/api
```

3. Démarrer le serveur de développement :
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3001`

## 🚀 Démarrage Rapide

1. **Backend** : Assurez-vous que le backend est démarré sur le port 5000
2. **Base de données** : MongoDB doit être accessible
3. **Seed** : Exécutez `node scripts/seedJewelry.js` pour peupler la base avec des produits
4. **Frontend** : `npm run dev` pour démarrer le développement

## 📋 Prérequis

- Node.js 18+
- MongoDB 4.4+
- API OpenAI (pour les fonctionnalités IA)

## 🏗️ Structure du projet

```
frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── AI/              # Composants IA
│   │   ├── Layout/          # Header, Footer, Layout
│   │   └── Product/         # Composants produits
│   ├── contexts/            # Contextes React (Auth, Cart, Wishlist)
│   ├── pages/               # Pages de l'application
│   │   └── admin/           # Pages administration
│   ├── services/            # Services API
│   ├── utils/               # Utilitaires
│   ├── App.jsx              # Composant principal
│   └── main.jsx             # Point d'entrée
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 🔌 Intégration avec le Backend

Le frontend communique avec le backend via les endpoints suivants :

- `/api/auth` - Authentification
- `/api/products` - Produits
- `/api/categories` - Catégories
- `/api/orders` - Commandes
- `/api/reviews` - Avis
- `/api/wishlist` - Wishlist

## 🎨 Personnalisation

### Couleurs

Les couleurs peuvent être modifiées dans `tailwind.config.js` :

```js
colors: {
  primary: { ... },
  secondary: { ... }
}
```

### Variables d'environnement

- `VITE_API_URL` - URL de l'API backend

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte à :
- 📱 Mobile (< 640px)
- 📱 Tablette (640px - 1024px)
- 💻 Desktop (> 1024px)

## 🤖 Fonctionnalités IA

### Recherche Intelligente
- Suggestions basées sur la requête
- Recherche sémantique
- Filtrage intelligent

### Recommandations
- Basées sur l'historique utilisateur
- Produits similaires
- Tendances populaires

### Chatbot
- Assistance en temps réel
- Suggestions contextuelles
- Support multilingue (prêt)

## 🚀 Build pour Production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`.

## 📄 Génération de PDF

Le système génère automatiquement des tickets de commande PDF lors de la finalisation d'une commande :

- **Génération automatique** : PDF créé dès la validation de commande
- **Téléchargement immédiat** : Fichier PDF téléchargé automatiquement dans le navigateur
- **Format professionnel** : Tickets incluant tous les détails de commande, adresse, et prix
- **Archivage** : Les clients peuvent garder leurs reçus pour leurs dossiers

## 📝 Notes

- Assurez-vous que le backend est démarré et accessible sur le port 5000
- Le frontend fonctionne sur le port 3001 (configurable dans `vite.config.js`)
- Les images sont servies depuis `http://localhost:5000/uploads/`
- Le système d'authentification utilise JWT avec refresh tokens
- La génération PDF nécessite la bibliothèque `pdfkit` côté backend

## 🔒 Sécurité

- Tokens JWT stockés dans localStorage
- Refresh automatique des tokens
- Protection des routes admin
- Validation côté client et serveur

## 📄 Licence

Ce projet fait partie de la plateforme Rouna E-commerce.
