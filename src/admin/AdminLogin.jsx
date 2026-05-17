import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const AdminLogin = () => {
  const navigate = useNavigate()
  const { signIn, configMissing, session, isAdmin, adminLoading } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session && isAdmin) {
      navigate('/admin/dashboard')
    }
  }, [session, isAdmin, navigate])

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await signIn(form.email, form.password)
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Wait for admin role check effect to complete before redirecting.
    setLoading(false)
  }

  if (configMissing) {
    return (
      <div className="page container">
        <div className="notice-card">
          <h2>Admin access is offline</h2>
          <p>
            Add Supabase credentials in your .env file to enable secure admin
            authentication.
          </p>
        </div>
      </div>
    )
  }

  if (session && !adminLoading && !isAdmin) {
    return (
      <div className="page container">
        <div className="notice-card">
          <h2>Admin access required</h2>
          <p>Your account is signed in but does not have admin privileges.</p>
          <p className="muted">Use an admin account or ask to be added to admin_users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page container auth-page">
      <div className="auth-card">
        <h2>Admin login</h2>
        <p>Sign in with your Supabase admin account.</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <label className="form-field">
            Email
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              required
            />
          </label>
          <label className="form-field">
            Password
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
