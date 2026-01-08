import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { Search, ShoppingCart, Heart, User, Menu, X, LogOut } from 'lucide-react'
import AISearch from '../AI/AISearch'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const { getCartItemsCount } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-white shadow-md py-3'
          : 'bg-white/95 backdrop-blur-sm py-4'
          }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="text-2xl font-display font-bold text-secondary-900">
                Rouna
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/products"
                className="text-secondary-700 hover:text-primary-600 font-medium transition-colors"
              >
                Bijoux
              </Link>
              <Link
                to="/category/colliers"
                className="text-secondary-700 hover:text-primary-600 font-medium transition-colors"
              >
                Colliers
              </Link>
              <Link
                to="/category/bagues"
                className="text-secondary-700 hover:text-primary-600 font-medium transition-colors"
              >
                Bagues
              </Link>
              <Link
                to="/category/gourmettes"
                className="text-secondary-700 hover:text-primary-600 font-medium transition-colors"
              >
                Gourmettes
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-secondary-700 hover:text-primary-600 transition-colors"
                aria-label="Rechercher"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart */}
              {isAuthenticated && user?.role !== 'admin' && (
                <Link
                  to="/cart"
                  className="relative p-2 text-secondary-700 hover:text-primary-600 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {getCartItemsCount() > 0 && (
                    <span className="absolute top-0 right-0 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getCartItemsCount()}
                    </span>
                  )}
                </Link>
              )}

              {/* Wishlist */}
              {isAuthenticated && user?.role !== 'admin' && (
                <Link
                  to="/wishlist"
                  className="p-2 text-secondary-700 hover:text-primary-600 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                </Link>
              )}

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 text-secondary-700 hover:text-primary-600 transition-colors">
                    <User className="w-5 h-5" />
                    <span className="hidden lg:inline">{user?.username}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {user?.role !== 'admin' && (
                      <>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-secondary-700 hover:bg-secondary-50 transition-colors"
                        >
                          Mon profil
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-secondary-700 hover:bg-secondary-50 transition-colors"
                        >
                          Mes commandes
                        </Link>
                      </>
                    )}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-secondary-700 hover:bg-secondary-50 transition-colors"
                      >
                        Administration
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-secondary-700 hover:bg-secondary-50 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-primary hidden sm:inline-flex"
                >
                  Connexion
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-secondary-700"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-secondary-200 mt-4 pt-4 pb-4">
            <div className="container-custom space-y-4">
              <Link
                to="/products"
                className="block text-secondary-700 hover:text-primary-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Bijoux
              </Link>
              <Link
                to="/category/colliers"
                className="block text-secondary-700 hover:text-primary-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Colliers
              </Link>
              <Link
                to="/category/bagues"
                className="block text-secondary-700 hover:text-primary-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Bagues
              </Link>
              <Link
                to="/category/gourmettes"
                className="block text-secondary-700 hover:text-primary-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Gourmettes
              </Link>
              {isAuthenticated ? (
                <>
                  {user?.role !== 'admin' && (
                    <Link
                      to="/wishlist"
                      className="block text-secondary-700 hover:text-primary-600 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Wishlist
                    </Link>
                  )}
                  {user?.role !== 'admin' && (
                    <Link
                      to="/profile"
                      className="block text-secondary-700 hover:text-primary-600 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Mon profil
                    </Link>
                  )}
                  {user?.role !== 'admin' && (
                    <Link
                      to="/orders"
                      className="block text-secondary-700 hover:text-primary-600 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Mes commandes
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="block w-full text-left text-secondary-700 hover:text-primary-600 font-medium"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block btn btn-primary text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Connexion
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20" />

      {/* AI Search Modal */}
      {isSearchOpen && (
        <AISearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      )}
    </>
  )
}

export default Header

