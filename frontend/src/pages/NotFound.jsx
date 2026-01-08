import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="py-20">
      <div className="container-custom text-center">
        <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-secondary-900 mb-4">
          Page non trouvée
        </h2>
        <p className="text-secondary-600 mb-8 max-w-md mx-auto">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className="btn btn-primary inline-flex items-center space-x-2">
          <Home className="w-5 h-5" />
          <span>Retour à l'accueil</span>
        </Link>
      </div>
    </div>
  )
}

export default NotFound

