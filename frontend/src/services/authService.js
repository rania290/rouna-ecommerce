import api from '../utils/api'

export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      // Stocker les tokens sous response.data.data
      const payload = response.data?.data || response.data
      if (payload?.accessToken) {
        localStorage.setItem('accessToken', payload.accessToken)
        localStorage.setItem('refreshToken', payload.refreshToken)
      }
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      throw error
    }
  },

  login: async (credentials) => {
    try {
      console.log('Tentative de connexion avec les identifiants:', {
        email: credentials.email,
        password: credentials.password ? '***' : 'non fourni'
      });
      
      const response = await api.post('/auth/login', credentials);
      console.log('Réponse du serveur:', response.data);
      
      const payload = response.data?.data || response.data;
      if (payload?.accessToken) {
        console.log('Jetons reçus, stockage...');
        localStorage.setItem('accessToken', payload.accessToken);
        localStorage.setItem('refreshToken', payload.refreshToken);
      } else {
        console.warn('Aucun jeton d\'accès reçu dans la réponse');
        throw new Error('Réponse invalide du serveur');
      }
      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la connexion:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Améliorer le message d'erreur
      if (error.response) {
        // Le serveur a répondu avec un statut d'erreur
        if (error.response.status === 401) {
          error.message = 'Email ou mot de passe incorrect.';
        } else if (error.response.status === 403) {
          error.message = 'Votre compte est désactivé. Contactez l\'administrateur.';
        } else if (error.response.data?.message) {
          error.message = error.response.data.message;
        }
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        error.message = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
      }
      
      throw error;
    }
  },

  logout: async () => {
    await api.post('/auth/logout')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  },

  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData)
    return response.data
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    const response = await api.post('/auth/refresh-token', { refreshToken })
    const access = response.data?.data?.accessToken
    if (access) {
      localStorage.setItem('accessToken', access)
    }
    return response.data
  },
}