import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-secondary-900 text-white mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">Rouna</h3>
            <p className="text-secondary-400 mb-4">
              Votre destination pour les accessoires de mode les plus élégants.
              Découvrez notre collection exclusive de bijoux raffinés.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-secondary-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-secondary-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-secondary-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/products"
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  Tous les bijoux
                </Link>
              </li>
              <li>
                <Link
                  to="/category/colliers"
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  Colliers
                </Link>
              </li>
              <li>
                <Link
                  to="/category/gourmettes"
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  Gourmettes
                </Link>
              </li>
              <li>
                <Link
                  to="/category/braclets"
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  Bracelets
                </Link>
              </li>
              <li>
                <Link
                  to="/category/bagues"
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  Bagues
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Service client</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/profile"
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  Mon compte
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  Mes commandes
                </Link>
              </li>
              <li>
                <Link
                  to="/wishlist"
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  Ma wishlist
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@rouna.com"
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  Contactez-nous
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-secondary-400" />
                <span className="text-secondary-400">contact@rouna.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-secondary-400" />
                <span className="text-secondary-400">+216 54 398 397</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-800 mt-8 pt-8 text-center text-secondary-400">
          <p>&copy; {new Date().getFullYear()} Rouna. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
