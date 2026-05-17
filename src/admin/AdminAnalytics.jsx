import { useEffect, useState, useMemo } from 'react'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'
import { fetchOrders } from '../lib/orders'
import { fetchProducts } from '../lib/products'
import { formatPrice } from '../lib/format'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    let mounted = true
    Promise.all([fetchOrders(), fetchProducts()])
      .then(([o, p]) => {
        if (!mounted) return
        setOrders(o || [])
        setProducts(p || [])
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="loader-wrapper">
        <div className="loader" />
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (!orders.length) {
    return (
      <div className="section container">
        <EmptyState title="No sales data" description="No orders yet to display analytics." />
      </div>
    )
  }

  const totalOrders = orders.length
  const paidOrders = orders.filter((o) => o.status === 'paid')
  const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.amount || 0), 0)
  const pending = orders.filter((o) => o.status === 'pending').length

  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const monthlyRevenue = paidOrders
    .filter((o) => new Date(o.created_at) >= monthAgo)
    .reduce((s, o) => s + Number(o.amount || 0), 0)

  // 30-day revenue series
  const dailyRevenue = useMemo(() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      days.push({ key, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), revenue: 0 })
    }
    const map = Object.fromEntries(days.map((d) => [d.key, { ...d }]))
    paidOrders.forEach((o) => {
      const k = new Date(o.created_at).toISOString().slice(0, 10)
      if (map[k]) map[k].revenue += Number(o.amount || 0)
    })
    return Object.values(map)
  }, [paidOrders])

  // Top products
  const productMap = {}
  orders.forEach((o) => {
    const slug = o.product_slug || o.product_title || 'Unknown'
    if (!productMap[slug]) productMap[slug] = { count: 0, revenue: 0 }
    productMap[slug].count += 1
    productMap[slug].revenue += Number(o.amount || 0)
  })
  const topProducts = Object.keys(productMap)
    .map((slug) => ({ slug, ...productMap[slug] }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  // Top customers
  const topCustomers = useMemo(() => {
    const m = {}
    orders.forEach((o) => {
      const email = (o.buyer_email || 'Unknown').toLowerCase()
      if (!m[email]) m[email] = { email, revenue: 0, orders: 0 }
      m[email].revenue += Number(o.amount || 0)
      m[email].orders += 1
    })
    return Object.values(m).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  }, [orders])

  return (
    <section className="admin-grid">
      <div className="admin-card">
        <h3>Analytics</h3>
        <div className="stats-grid">
          <StatCard label="Total Revenue" value={formatPrice(totalRevenue)} />
          <StatCard label="Revenue (30d)" value={formatPrice(monthlyRevenue)} />
          <StatCard label="Total Orders" value={totalOrders} />
          <StatCard label="Pending Orders" value={pending} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="card">
            <h4>Revenue (last 30 days)</h4>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" minTickGap={10} />
                  <YAxis />
                  <Tooltip formatter={(v) => formatPrice(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h4>Top Products (by revenue)</h4>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="slug" width={160} />
                  <Tooltip formatter={(v) => formatPrice(v)} />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <h4 style={{ marginTop: '1rem' }}>Top Customers</h4>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Orders</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c) => (
                <tr key={c.email}>
                  <td>{c.email}</td>
                  <td>{c.orders}</td>
                  <td>{formatPrice(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default AdminAnalytics
