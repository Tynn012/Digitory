import { NavLink } from 'react-router-dom'
import { useBranding } from '../lib/branding'

const AdminSidebar = ({ onSignOut }) => {
  const { branding } = useBranding()

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <span className="admin-brand-title">{branding.site_name || 'Digitory'}</span>
        <span className="admin-subtitle">Admin Dashboard</span>
      </div>
      <nav className="admin-nav">
        <NavLink to="/admin/dashboard">Overview</NavLink>
        <NavLink to="/admin/products">Products</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
        <NavLink to="/admin/analytics">Analytics</NavLink>
        <NavLink to="/admin/branding">Branding</NavLink>
      </nav>
      <button
        type="button"
        className="button ghost admin-signout"
        onClick={onSignOut}
      >
        Sign out
      </button>
    </aside>
  )
}

export default AdminSidebar
