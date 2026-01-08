import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { categoryService } from '../../services/categoryService'
import { Plus, Loader, Edit, Trash } from 'lucide-react'

const AdminCategories = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/')
    }
    loadCategories()
  }, [user, navigate])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await categoryService.getCategories()
      setCategories(data.data || data.categories || data || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
    setShowForm(true)
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setFormData({ name: category.name, description: category.description || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory._id, formData)
      } else {
        await categoryService.createCategory(formData)
      }
      setShowForm(false)
      loadCategories()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await categoryService.deleteCategory(id)
        loadCategories()
      } catch (error) {
        console.error('Erreur:', error)
      }
    }
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-secondary-900">
            Gestion des catégories
          </h1>
          <button onClick={handleAddCategory} className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Ajouter une catégorie</span>
          </button>
        </div>

        {showForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <div className="flex space-x-4">
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Enregistrement...' : (editingCategory ? 'Modifier' : 'Ajouter')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div key={category._id} className="card p-6">
                <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                {category.description && (
                  <p className="text-secondary-600 mb-4">{category.description}</p>
                )}
                <div className="flex space-x-2">
                  <button onClick={() => handleEditCategory(category)} className="btn btn-outline flex-1 flex items-center justify-center space-x-2">
                    <Edit className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                  <button onClick={() => handleDeleteCategory(category._id)} className="btn btn-danger flex items-center justify-center">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCategories

