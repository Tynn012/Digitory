import { useEffect, useMemo, useState } from 'react'
import { categories } from '../data/products'
import { fetchProducts, saveProduct, deleteProduct, setProductArchived } from '../lib/products'
import { slugify } from '../lib/format'
import EmptyState from '../components/EmptyState'

const defaultDraft = {
  title: '',
  slug: '',
  description: '',
  price: '',
  category: '',
  featured: false,
  thumbnail: '',
  images: '',
  tags: '',
  digital_file_url: '',
}

const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [draft, setDraft] = useState(defaultDraft)
  const [editingId, setEditingId] = useState(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts({ includeArchived: true })
      .then((data) => {
        setProducts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleChange = (field) => (event) => {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value
    setDraft((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'title' && !slugTouched) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  const handleSlugChange = (event) => {
    setSlugTouched(true)
    setDraft((prev) => ({ ...prev, slug: event.target.value }))
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setSlugTouched(true)
    setDraft({
      title: product.title || '',
      slug: product.slug || '',
      description: product.description || '',
      price: product.price ?? '',
      category: product.category || '',
      featured: Boolean(product.featured),
      thumbnail: product.thumbnail || '',
      images: Array.isArray(product.images) ? product.images.join('\n') : '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      digital_file_url: product.digital_file_url || '',
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setSlugTouched(false)
    setDraft(defaultDraft)
  }

  const buildPayload = () => ({
    id: editingId,
    title: draft.title.trim(),
    slug: draft.slug.trim(),
    description: draft.description.trim(),
    price: Number(draft.price || 0),
    category: draft.category.trim(),
    featured: Boolean(draft.featured),
    thumbnail: draft.thumbnail.trim(),
    images: draft.images
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean),
    tags: draft.tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    digital_file_url: draft.digital_file_url.trim(),
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = buildPayload()
    const saved = await saveProduct(payload)
    setProducts((prev) => {
      if (editingId) {
        return prev.map((item) => (item.id === saved.id ? saved : item))
      }
      return [saved, ...prev]
    })
    resetForm()
  }

  const handleDelete = async (id) => {
    await deleteProduct(id)
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, archived: true } : item,
      ),
    )
  }

  const handleToggleArchive = async (product) => {
    const updated = await setProductArchived(product.id, !product.archived)
    setProducts((prev) =>
      prev.map((item) => (item.id === product.id ? updated : item)),
    )
  }

  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        if (a.featured === b.featured) {
          return (a.title || '').localeCompare(b.title || '')
        }
        return a.featured ? -1 : 1
      }),
    [products],
  )

  if (loading) {
    return (
      <div className="loader-wrapper">
        <div className="loader" />
        <p>Loading products...</p>
      </div>
    )
  }

  return (
    <div className="admin-grid">
      <section className="admin-card">
        <h3>{editingId ? 'Edit product' : 'Add product'}</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <label className="form-field">
            Title
            <input
              type="text"
              value={draft.title}
              onChange={handleChange('title')}
              required
            />
          </label>
          <label className="form-field">
            Slug
            <input type="text" value={draft.slug} onChange={handleSlugChange} />
          </label>
          <label className="form-field">
            Description
            <textarea
              rows="3"
              value={draft.description}
              onChange={handleChange('description')}
            />
          </label>
          <label className="form-field">
            Price (PHP)
            <input
              type="number"
              value={draft.price}
              onChange={handleChange('price')}
              min="0"
            />
          </label>
          <label className="form-field">
            Category
            <select value={draft.category} onChange={handleChange('category')}>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field checkbox">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={handleChange('featured')}
            />
            Featured product
          </label>
          <label className="form-field">
            Thumbnail URL
            <input
              type="text"
              value={draft.thumbnail}
              onChange={handleChange('thumbnail')}
            />
          </label>
          <label className="form-field">
            Image URLs (comma or new line)
            <textarea
              rows="3"
              value={draft.images}
              onChange={handleChange('images')}
            />
          </label>
          <label className="form-field">
            Tags (comma separated)
            <input type="text" value={draft.tags} onChange={handleChange('tags')} />
          </label>
          <label className="form-field">
            Download link
            <input
              type="text"
              value={draft.digital_file_url}
              onChange={handleChange('digital_file_url')}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="button primary">
              {editingId ? 'Save changes' : 'Add product'}
            </button>
            <button type="button" className="button ghost" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </section>
      <section className="admin-card">
        <h3>Products</h3>
        {sortedProducts.length ? (
          <div className="product-admin-list">
            {sortedProducts.map((product) => (
              <div key={product.id} className="product-admin-item">
                <div>
                  <h4>
                    {product.title}
                    {product.archived ? ' (Archived)' : ''}
                  </h4>
                  <p>{product.category}</p>
                </div>
                <div className="product-admin-actions">
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => handleEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button ghost danger"
                    onClick={() => handleDelete(product.id)}
                    disabled={product.archived}
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => handleToggleArchive(product)}
                  >
                    {product.archived ? 'Unarchive' : 'Set archived'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No products yet"
            description="Add your first template to start selling on Digitory."
          />
        )}
      </section>
    </div>
  )
}

export default AdminProducts
