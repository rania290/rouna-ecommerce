# Guide de test de l'API

## 🚀 Démarrage rapide

### 1. Créer un utilisateur admin

```bash
cd backend
node scripts/createAdminUser.js
```

**Identifiants par défaut :**
- Email: `admin@rouna.com`
- Password: `admin123`

### 2. Se connecter et obtenir un token

**POST** `http://localhost:5000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "admin@rouna.com",
  "password": "admin123"
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Connexion réussie!",
  "data": {
    "user": {
      "id": "...",
      "username": "admin",
      "email": "admin@rouna.com",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

### 3. Tester les routes protégées

Utilisez le `accessToken` dans le header Authorization :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 Exemples de requêtes

### Créer une catégorie (Admin uniquement)

**POST** `http://localhost:5000/api/categories`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Accessoires",
  "description": "Catégorie pour les accessoires de mode",
  "slug": "accessoires"
}
```

### Créer un produit (Admin uniquement)

**POST** `http://localhost:5000/api/products`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Sac à main élégant",
  "description": "Un magnifique sac à main en cuir",
  "price": 99.99,
  "category": "CATEGORY_ID",
  "stock": 50
}
```

### Récupérer toutes les catégories (Public)

**GET** `http://localhost:5000/api/categories`

Aucune authentification requise.

## 🔧 Scripts utiles

### Promouvoir un utilisateur existant en admin

```bash
node scripts/createAdmin.js email@example.com
```

### Créer un utilisateur admin personnalisé

```bash
node scripts/createAdminUser.js email@example.com username password
```

### Mettre à jour le rôle d'un utilisateur

```bash
node scripts/updateUserRole.js email@example.com admin
```

## ⚠️ Notes importantes

- Changez toujours le mot de passe par défaut après la première connexion
- Les tokens expirent après 24h (configurable dans `config/jwt.js`)
- Utilisez le `refreshToken` pour obtenir un nouveau `accessToken` si nécessaire

