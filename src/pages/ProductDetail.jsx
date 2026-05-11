import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProductBySlug } from '../lib/products'
import { formatPrice } from '../lib/format'
import ProductGallery from '../components/ProductGallery'

const features = [
  'Instant download once payment is verified',
  'Editable files with clear structure',
  'Includes quick start instructions',
]

const ProductDetail = () => {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProductBySlug(slug)
      .then((data) => {
        setProduct(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="loader-wrapper">
        <div className="loader" />
        <p>Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="section container">
        <div className="notice-card">
          <h2>Product not found</h2>
          <p>We could not locate that product. Browse the catalog instead.</p>
          <Link to="/products" className="button primary">
            Back to products
          </Link>
        </div>
      </div>
    )
  }

  const galleryImages = product.images?.length
    ? product.images
    : product.thumbnail
      ? [product.thumbnail]
      : []

  return (
    <div className="section">
      <div className="container product-detail">
        <ProductGallery images={galleryImages} title={product.title} />
        <div className="product-detail-info">
          <span className="eyebrow">{product.category}</span>
          <h2>{product.title}</h2>
          <p>{product.description}</p>
          <div className="product-price">{formatPrice(product.price)}</div>
          <div className="detail-actions">
            <Link to={`/checkout/${product.slug}`} className="button primary">
              Buy now
            </Link>
            <span className="muted">Instant download after verification.</span>
          </div>
          <div className="feature-list">
            {features.map((item) => (
              <div key={item} className="feature-item">
                <span className="dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
