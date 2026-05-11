import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fetchOrders, updateOrder, deleteOrder } from '../lib/orders'
import { formatPrice } from '../lib/format'
import EmptyState from '../components/EmptyState'

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
      .then((data) => {
        setOrders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleUpdate = async (id, updates) => {
    const updated = await updateOrder(id, updates)
    setOrders((prev) => prev.map((item) => (item.id === id ? updated : item)))
  }

  const handleDelete = async (id) => {
    await deleteOrder(id)
    setOrders((prev) => prev.filter((item) => item.id !== id))
  }

  const formatDate = (value) => {
    if (!value) return '—'
    return format(new Date(value), 'MMM d, yyyy')
  }

  if (loading) {
    return (
      <div className="loader-wrapper">
        <div className="loader" />
        <p>Loading orders...</p>
      </div>
    )
  }

  return (
    <section className="admin-card">
      <h3>Orders</h3>
      {orders.length ? (
        <div className="order-table">
          {orders.map((order) => (
            <div key={order.id} className="order-row">
              <div>
                <h4>{order.product_title || 'Untitled product'}</h4>
                <p className="muted">{order.customer_name}</p>
              </div>
              <div>
                <span className={`status-pill ${order.status}`}>
                  {order.status}
                </span>
                <p className="muted">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="order-amount">{formatPrice(order.amount)}</p>
                <p className="muted">GCash {order.gcash_reference}</p>
              </div>
              <div className="order-actions">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() =>
                    handleUpdate(order.id, {
                      status: 'paid',
                      paid_at: new Date().toISOString(),
                      download_unlocked: true,
                    })
                  }
                >
                  Mark paid
                </button>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() =>
                    handleUpdate(order.id, { download_unlocked: true })
                  }
                >
                  Unlock
                </button>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => handleUpdate(order.id, { status: 'rejected' })}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="button ghost danger"
                  onClick={() => handleDelete(order.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No orders yet"
          description="Orders from the checkout page will appear here."
        />
      )}
    </section>
  )
}

export default AdminOrders
