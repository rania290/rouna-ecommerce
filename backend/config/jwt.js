module.exports = {
    secret: process.env.JWT_SECRET || 'votre_secret_jwt_super_securise',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'votre_refresh_secret',
    tokenExpiration: '24h',
    refreshTokenExpiration: '7d'
  };