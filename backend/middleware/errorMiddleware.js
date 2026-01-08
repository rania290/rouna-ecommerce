const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Log détaillé de l'erreur
    console.error('\n--- ERREUR ---')
    console.error('Date:', new Date().toISOString())
    console.error('URL:', req.originalUrl)
    console.error('Méthode:', req.method)
    console.error('Corps de la requête:', req.body)
    console.error('Erreur:', err.message)
    console.error('Stack:', err.stack)
    console.error('--- FIN ERREUR ---\n')
    
    res.status(statusCode).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  };
  
  const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  };
  
  module.exports = { errorHandler, notFound };