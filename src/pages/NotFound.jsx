import { Link } from 'react-router-dom'

const NotFound = () => (
  <div className="section container">
    <div className="notice-card">
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist yet.</p>
      <Link to="/" className="button primary">
        Back home
      </Link>
    </div>
  </div>
)

export default NotFound
