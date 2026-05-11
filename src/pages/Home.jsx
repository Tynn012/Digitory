import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categories } from '../data/products'
import { fetchProducts } from '../lib/products'
import { useBranding } from '../lib/branding'
import ProductCard from '../components/ProductCard'

const highlights = [
  {
    title: 'Instant delivery',
    description: 'Download-ready templates the moment payment is verified.',
  },
  {
    title: 'Creator-ready files',
    description: 'Editable layouts in spreadsheets, PDFs, and Notion-ready kits.',
  },
  {
    title: 'Premium curation',
    description: 'Every asset is designed for clarity, speed, and repeat use.',
  },
]

const Home = () => {
  const { branding } = useBranding()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const featured = products.filter((product) => product.featured).slice(0, 4)

  return (
    <div className="home">
      <section className="hero section">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="eyebrow">Digitory marketplace</span>
            <h1>{branding.hero_title}</h1>
            <p className="hero-subtitle">{branding.hero_subtitle}</p>
            <div className="hero-actions">
              <Link to="/products" className="button primary">
                Browse templates
              </Link>
              <Link to="/products" className="button ghost">
                See featured picks
              </Link>
            </div>
            <div className="hero-metrics">
              <div>
                <h3>120+</h3>
                <p>Premium templates</p>
              </div>
              <div>
                <h3>4.9</h3>
                <p>Average rating</p>
              </div>
              <div>
                <h3>24h</h3>
                <p>Payment response</p>
              </div>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card-top">
              <span>New collection</span>
              <h2>Planning systems that feel effortless.</h2>
            </div>
            <div className="hero-card-list">
              <div>
                <p className="label">Budget Templates</p>
                <p>Cashflow + savings</p>
              </div>
              <div>
                <p className="label">Study Planners</p>
                <p>Exam sprint maps</p>
              </div>
              <div>
                <p className="label">Digital Cards</p>
                <p>Minimal thank yous</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container section-heading">
          <div>
            <h2>Featured products</h2>
            <p>Handpicked templates that keep your week on track.</p>
          </div>
          <Link to="/products" className="button ghost">
            View all
          </Link>
        </div>
        <div className="container">
          {loading ? (
            <div className="loader-wrapper">
              <div className="loader" />
            </div>
          ) : (
            <div className="grid grid-2">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container section-heading">
          <div>
            <h2>Shop by category</h2>
            <p>Every asset is designed to deliver clarity fast.</p>
          </div>
        </div>
        <div className="container grid grid-3">
          {categories.map((category) => (
            <div key={category} className="category-card">
              <h3>{category}</h3>
              <p>Curated templates built for this workflow.</p>
              <Link to="/products" className="button ghost">
                Explore
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container section-heading">
          <div>
            <h2>Why Digitory</h2>
            <p>Premium tools crafted for repeatable results.</p>
          </div>
        </div>
        <div className="container grid grid-3">
          {highlights.map((item) => (
            <div key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container cta-card">
          <div>
            <h2>Ready to level up your digital workflow?</h2>
            <p>
              Discover productivity systems that make planning feel effortless and
              premium.
            </p>
          </div>
          <Link to="/products" className="button primary">
            Start browsing
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
