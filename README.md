

# 💎 Rouna - Plateforme E-Commerce de Haute Joaillerie & IA

Rouna est une application web full-stack (MERN) sophistiquée conçue pour une bijouterie fine. Elle intègre des fonctionnalités avancées d'intelligence artificielle pour offrir une expérience d'achat personnalisée et un support client d'exception.

---

## 📑 Table des Matières
- [✨ Fonctionnalités](#-fonctionnalités)
- [🤖 Module Intelligence Artificielle](#-module-intelligence-artificielle)
- [🛠️ Stack Technique](#️-stack-technique)
- [📂 Structure du Projet](#-structure-du-projet)
- [🚀 Guide d'Installation](#-guide-dinstallation)
- [📡 API Documentation](#-api-documentation)
- [⚙️ Configuration (.env)](#️-configuration-env)
- [👨‍💼 Administration](#-administration)

---

## ✨ Fonctionnalités

### 🛍️ Pour les Clients
- **Catalogue Premium** : Navigation par catégories (bagues, colliers, bracelets, gourmettes).
- **Filtres Avancés** : Recherche par prix, catégorie, nouveautés et promotions.
- **Panier Intelligent** : Synchronisation persistante entre les sessions et migration automatique du panier "invité" lors de la connexion.
- **Wishlist** : Enregistrement des bijoux favoris pour plus tard.
- **Checkout Sécurisé** : Processus d'achat simplifié avec **Paiement à la Livraison** par défaut.
- **Facturation PDF** : Téléchargement automatique du ticket de commande au format PDF.

### 🤖 Module Intelligence Artificielle
- **Assistant Rouna** : Chatbot contextuel capable de répondre aux questions sur les produits et de fournir des informations de contact réelles.
- **Moteur de Recommandations** : Algorithme analysant les achats passés et les préférences pour suggérer des bijoux pertinents.
- **Recherche Sémantique** : Compréhension des requêtes naturelles pour trouver les articles correspondants.

### 🔒 Administration (Dashboard)
- **Gestion des Stocks** : Création, modification et désactivation de produits en temps réel.
- **Contrôle des Catégories** : Organisation de l'arborescence des bijoux.
- **Suivi des Commandes** : Gestion des statuts (En attente, Expédié, Livré, Annulé).
- **Analytics** : Statistiques détaillées sur les revenus, les commandes quotidiennes et le top des ventes.

---

## 🛠️ Stack Technique

- **Frontend** :
  - `React.js` (Vite)
  - `Framer Motion` (Animations fluides)
  - `Chakra UI` & `Tailwind CSS` (Style premium)
  - `Lucide React` (Iconographie moderne)
  - `Zustand` (Gestion d'état légère)
  
- **Backend** :
  - `Node.js` & `Express`
  - `MongoDB` & `Mongoose` (Base de données NoSQL)
  - `JWT` (Authentification sécurisée)
  - `Multer` (Gestion des uploads d'images)
  - `PDFKit` (Génération de documents PDF)
  
- **Services IA** :
  - `OpenAI API` (Moteur GPT-3.5 Turbo)

---

## 📂 Structure du Projet

```text
rouna-ecommerce/
├── backend/            # Code serveur & API
│   ├── config/         # Fichiers de configuration (DB, IA, JWT)
│   ├── controllers/    # Logique métier des routes
│   ├── middleware/     # Authentification & Upload
│   ├── models/         # Schémas Mongoose
│   ├── routes/         # Définition des endpoints API
│   ├── scripts/        # Outils d'initialisation et de seed
│   ├── services/       # Services tiers (IA, PDF)
│   └── uploads/        # Stockage local des images
├── frontend/           # Code client (Vite/React)
│   ├── src/
│   │   ├── components/ # Composants UI réutilisables
│   │   ├── contexts/   # Gestion des états globaux
│   │   ├── pages/      # Vues de l'application
│   │   └── services/   # Appels API axios
└── README.md           # Documentation principale
```

---

## 🚀 Guide d'Installation

### 1. Cloner le projet
```bash
git clone [URL_DU_REPO]
cd rouna-ecommerce
```

### 2. Configurer le Backend
```bash
cd backend
npm install
# Créez votre fichier .env (voir section Configuration)
node scripts/initSystem.js   # Initialiser les comptes par défaut
node scripts/seedJewelry.js # Remplir avec les données de démonstration
npm run dev
```

### 3. Configurer le Frontend
```bash
cd ../frontend
npm install
npm run dev
```

---

## 📡 API Documentation (Points d'entrée principaux)

| Méthode | Endpoint | Description | Accès |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Inscription nouvel utilisateur | Public |
| **POST** | `/api/auth/login` | Connexion & récupération token | Public |
| **GET** | `/api/products` | Liste les bijoux (avec filtres) | Public |
| **GET** | `/api/products/:id` | Détails d'un bijou | Public |
| **POST** | `/api/orders` | Création d'une commande | Connecté |
| **GET** | `/api/admin/orders` | Toutes les commandes | Admin |
| **POST** | `/api/ai/chat` | Discussion avec l'assistant IA | Public/Connecté |

---

## ⚙️ Configuration (.env)

Créez un fichier `.env` dans le dossier `backend` avec les variables suivantes :
- `MONGO_URI` : URL de votre base de données MongoDB.
- `JWT_SECRET` : Clé secrète pour les signatures de token.
- `OPENAI_API_KEY` : Votre clé API OpenAI pour activer le Chatbot.
- `AI_ENABLED` : `true` ou `false` pour activer/désactiver le module IA.

---

## 👨‍💼 Administration

Pour accéder au dashboard admin, utilisez les identifiants créés par le script `initSystem.js` :
- **Email** : `admin@rouna.com`
- **Password** : `admin123`

---
*Propulsé par Rouna - L'excellence au service de votre style.*
