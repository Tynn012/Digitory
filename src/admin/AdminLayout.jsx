import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useBranding } from '../lib/branding'

const AdminLayout = () => {
  const { signOut } = useAuth()
  const { branding } = useBranding()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-text">{branding.site_name || 'Digitory'}</span>
          <span className="admin-subtitle">Admin Dashboard</span>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin/dashboard">Overview</NavLink>
          <NavLink to="/admin/products">Products</NavLink>
          <NavLink to="/admin/orders">Orders</NavLink>
          <NavLink to="/admin/branding">Branding</NavLink>
        </nav>
        <button type="button" className="button ghost" onClick={handleSignOut}>
          Sign out
        </button>
      </aside>
      <section className="admin-content">
        <div className="admin-top">
          <h1>Admin</h1>
          <p>Manage products, orders, and the Digitory brand experience.</p>
        </div>
        <Outlet />
      </section>
    </div>
  )
}

export default AdminLayout
