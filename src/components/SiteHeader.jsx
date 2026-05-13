import { Link, NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useBranding } from '../lib/branding'

const SiteHeader = () => {
  const { branding } = useBranding()
  const siteName = branding.site_name || 'Digitory'

  return (
    <header className="site-header">
      <div className="container nav-bar">
        <Link to="/" className="brand">
          {branding.logo_url ? (
            <img src={branding.logo_url} alt={siteName} className="brand-logo" />
          ) : (
            <span className="brand-text">{siteName}</span>
          )}
          <span className="brand-badge">Digital Market</span>
        </Link>
        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => clsx('nav-link', isActive && 'active')}
          >
            Home
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) => clsx('nav-link', isActive && 'active')}
          >
            Products
          </NavLink>
        </nav>
        <div className="nav-actions">
          <Link to="/products" className="button primary">
            Explore Templates
          </Link>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
