import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const ProtectedRoute = ({ children }) => {
  const { session, loading, configMissing } = useAuth()

  if (loading) {
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

  return children
}

export default ProtectedRoute
