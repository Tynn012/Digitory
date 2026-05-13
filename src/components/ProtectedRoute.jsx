import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const ProtectedRoute = ({ children }) => {
  const { session, loading, configMissing, isAdmin, adminLoading, adminError } =
    useAuth()

  if (loading || adminLoading) {
    return (
      <div className="loader-wrapper">
        <div className="loader" />
        <p>Checking admin access...</p>
      </div>
    )
  }

  if (configMissing) {
    return (
      <div className="page container">
        <div className="notice-card">
          <h2>Supabase setup required</h2>
          <p>
            Add your Supabase credentials to enable admin access and secure
            routes.
          </p>
          <p className="muted">Update the .env file, then restart the dev server.</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin" replace />
  }

  if (!isAdmin) {
    return (
      <div className="page container">
        <div className="notice-card">
          <h2>Admin access required</h2>
          <p>
            {adminError ||
              'Your account does not have access to the admin dashboard.'}
          </p>
          <p className="muted">Ask an admin to add your user to admin_users.</p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
