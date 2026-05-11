import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { formatPrice } from '../lib/format'

const ProductCard = ({ product }) => (
  <article className={clsx('product-card', product.featured && 'featured')}>
    <div className="product-image">
      {product.thumbnail ? (
        <img src={product.thumbnail} alt={product.title} />
      ) : (
        <div className="image-placeholder" />
      )}
      {product.featured && <span className="badge">Featured</span>}
    </div>
    <div className="product-body">
      <div>
        <h3>{product.title}</h3>
        <p>{product.description}</p>
      </div>
      <div className="product-meta">
        <span className="price">{formatPrice(product.price)}</span>
        <Link to={`/products/${product.slug}`} className="button ghost">
          View details
        </Link>
      </div>
    </div>
  </article>
)

export default ProductCard
