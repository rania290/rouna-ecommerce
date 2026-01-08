import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const data = await authService.getMe()
        const meUser = data?.data?.user
        const meProfile = data?.data?.profile
        
        if (meUser) {
          setUser({ ...meUser, profile: meProfile })
          setIsAuthenticated(true)
        } else {
          // Token invalide ou utilisateur non trouvé
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      // Commented out console.error to prevent memory accumulation
      // console.error('Erreur lors de la vérification de l\'authentification:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials)
      const loggedUser = data?.data?.user
      const loggedProfile = data?.data?.profile
      
      if (!loggedUser) {
        throw new Error('Réponse invalide du serveur')
      }
      
      setUser(loggedUser ? { ...loggedUser, profile: loggedProfile } : null)
      setIsAuthenticated(true)
      toast.success('Connexion réussie !')
      return data
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        'Erreur de connexion. Vérifiez vos identifiants.'

      toast.error(errorMessage)
      // Commented out console.error to prevent memory accumulation
      // console.error('Erreur de connexion:', error)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const data = await authService.register(userData)
      const registeredUser = data?.data?.user
      const registeredProfile = data?.data?.profile
      
      if (registeredUser) {
        setUser(registeredUser ? { ...registeredUser, profile: registeredProfile } : null)
        setIsAuthenticated(true)
      }
      
      toast.success('Inscription réussie !')
      return data
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? error.response.data.errors.map((e) => e.msg || e.message).join(', ')
          : 'Erreur d\'inscription')

      toast.error(errorMessage)
      // Commented out console.error to prevent memory accumulation
      // console.error('Erreur d\'inscription:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      setIsAuthenticated(false)
      toast.success('Déconnexion réussie')
    } catch (error) {
      // Commented out console.error to prevent memory accumulation
      // console.error('Erreur de déconnexion:', error)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const data = await authService.updateProfile(profileData)
      const updatedUser = data?.data?.user
      const updatedProfile = data?.data?.profile
      setUser(updatedUser ? { ...updatedUser, profile: updatedProfile } : null)
      toast.success('Profil mis à jour !')
      return data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur de mise à jour')
      throw error
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
