import { useEffect, useState } from 'react'
import { fetchProducts } from '../lib/products'
import { fetchOrders } from '../lib/orders'
import { formatPrice } from '../lib/format'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'

const AdminDashboard = () => {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([fetchProducts(), fetchOrders()])
      .then(([productData, orderData]) => {
        if (mounted) {
          setProducts(productData)
          setOrders(orderData)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  const pendingOrders = orders.filter((order) => order.status === 'pending')
  const featuredProducts = products.filter((product) => product.featured)
  const revenue = orders
    .filter((order) => order.status === 'paid')
    .reduce((total, order) => total + Number(order.amount || 0), 0)

  const recentOrders = orders.slice(0, 5)

  if (loading) {
    return (
      <div className="loader-wrapper">
        <div className="loader" />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="admin-grid">
      <div className="stat-grid">
        <StatCard label="Total products" value={products.length} />
        <StatCard label="Total orders" value={orders.length} />
        <StatCard label="Pending payments" value={pendingOrders.length} />
        <StatCard label="Featured products" value={featuredProducts.length} />
        <StatCard
          label="Paid revenue"
          value={formatPrice(revenue)}
          hint="Confirmed orders only"
        />
      </div>
      <section className="admin-card">
        <h3>Recent orders</h3>
        {recentOrders.length ? (
          <div className="order-list">
            {recentOrders.map((order) => (
              <div key={order.id} className="order-item">
                <div>
                  <p className="order-title">{order.product_title}</p>
                  <span className={`status-pill ${order.status}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-meta">
                  <span>{order.customer_name}</span>
                  <span>{formatPrice(order.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No orders yet"
            description="Orders placed on the checkout page will show up here."
          />
        )}
      </section>
    </div>
  )
}

export default AdminDashboard
