import { Outlet } from 'react-router-dom'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

const PublicLayout = () => (
  <>
    <SiteHeader />
    <main className="page">
      <Outlet />
    </main>
    <SiteFooter />
  </>
)

export default PublicLayout
