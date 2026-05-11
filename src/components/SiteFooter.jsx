import { categories } from '../data/products'
import { useBranding } from '../lib/branding'

const SiteFooter = () => {
  const { branding } = useBranding()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <h3>{branding.site_name || 'Digitory'}</h3>
          <p>
            A premium marketplace for digital templates, trackers, and printable
            assets built for modern, focused creators.
          </p>
        </div>
        <div>
          <h4>Categories</h4>
          <div className="footer-links">
            {categories.map((category) => (
              <span key={category}>{category}</span>
            ))}
          </div>
        </div>
        <div>
          <h4>Support</h4>
          <p>
            Instant access after payment verification. Orders are reviewed during
            business hours (9am - 6pm).
          </p>
        </div>
      </div>
      <div className="container footer-base">
        <span>© {year} {branding.site_name || 'Digitory'}</span>
        <span>Built for creators who want clarity.</span>
      </div>
    </footer>
  )
}

export default SiteFooter
