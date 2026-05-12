import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

const AdminLayout = () => {
  return (
    <div className="admin-shell">
      <AdminSidebar />
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
