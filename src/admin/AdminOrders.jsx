import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  fetchOrders,
  updateOrder,
  deleteOrder,
  createDownloadToken,
} from '../lib/orders'
import { fetchProductBySlug } from '../lib/products'
import { formatPrice } from '../lib/format'
import EmptyState from '../components/EmptyState'
import { sendReceiptEmail } from '../lib/receipts'

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOrders()
      .then((data) => {
        setOrders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleUpdate = async (id, updates) => {
    setNotice('')
    setError('')
    try {
      const updated = await updateOrder(id, updates)
      setOrders((prev) => prev.map((item) => (item.id === id ? updated : item)))
      if (updates.status === 'rejected') {
        setNotice('Order rejected.')
        return
      }
      if (updates.download_unlocked) {
        setNotice('Order unlocked.')
        return
      }
      setNotice('Order updated.')
    } catch (err) {
      setError(err.message || 'Unable to update order.')
    }
  }

  const handleDelete = async (id) => {
    setNotice('')
    setError('')
    try {
      await deleteOrder(id)
      setOrders((prev) => prev.filter((item) => item.id !== id))
      setNotice('Order deleted.')
    } catch (err) {
      setError(err.message || 'Unable to delete order.')
    }
  }

  const formatDate = (value) => {
    if (!value) return '—'
    return format(new Date(value), 'MMM d, yyyy')
  }

  const ensureDownloadLink = async (order) => {
    if (order.download_url) {
      return order
    }

    if (!order.product_slug) {
      return order
    }

    try {
      const product = await fetchProductBySlug(order.product_slug)
      const fallbackUrl = product?.digital_file_url?.trim()

      if (!fallbackUrl) {
        return order
      }

      const updated = await updateOrder(order.id, { download_url: fallbackUrl })
      setOrders((prev) =>
        prev.map((item) => (item.id === order.id ? updated : item)),
      )
      return updated
    } catch {
      return order
    }
  }

  const handleMarkPaid = async (order) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Mark this order as paid and unlock the download?')
    ) {
      return
    }

    setNotice('')
    setError('')
    const downloadToken = order.download_token || createDownloadToken()

    try {
      const updated = await updateOrder(order.id, {
        status: 'paid',
        paid_at: new Date().toISOString(),
        download_unlocked: true,
        download_token: downloadToken,
      })
      setOrders((prev) =>
        prev.map((item) => (item.id === order.id ? updated : item)),
      )
      setNotice('Payment marked as paid. Send receipt when ready.')
    } catch (err) {
      setError(err.message || 'Unable to mark as paid.')
    }
  }

  const handleSendReceipt = async (order) => {
    setNotice('')
    setError('')

    if (!order.buyer_email) {
      setError('Missing buyer email.')
      return
    }

    if (!order.download_unlocked) {
      setError('Unlock the order before sending a receipt.')
      return
    }

    const downloadToken = order.download_token || createDownloadToken()
    let updatedOrder = order

    try {
      if (!order.download_token) {
        updatedOrder = await updateOrder(order.id, {
          download_token: downloadToken,
        })
        setOrders((prev) =>
          prev.map((item) => (item.id === order.id ? updatedOrder : item)),
        )
      }

      updatedOrder = await ensureDownloadLink(updatedOrder)
      if (!updatedOrder.download_url) {
        setError('Missing download link on the order and product.')
        return
      }

      await sendReceiptEmail({
        orderId: updatedOrder.id,
        email: updatedOrder.buyer_email,
        customerName: updatedOrder.customer_name,
        productTitle: updatedOrder.product_title,
        amount: updatedOrder.amount,
        downloadToken: updatedOrder.download_token,
      })

      const withReceipt = await updateOrder(order.id, {
        receipt_sent_at: new Date().toISOString(),
      })
      setOrders((prev) =>
        prev.map((item) => (item.id === order.id ? withReceipt : item)),
      )
      setNotice('Receipt sent to buyer.')
    } catch (err) {
      setError(err.message || 'Unable to send receipt.')
    }
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
      {notice && <div className="success-card">{notice}</div>}
      {error && <p className="form-error">{error}</p>}
      {orders.length ? (
        <div className="order-table">
          {orders.map((order) => (
            <div key={order.id} className="order-row">
              <div>
                <h4>{order.product_title || 'Untitled product'}</h4>
                <p className="muted">{order.customer_name}</p>
                {order.buyer_email && <p className="muted">{order.buyer_email}</p>}
              </div>
              <div>
                <span className={`status-pill ${order.status}`}>
                  {order.status}
                </span>
                <p className="muted">{formatDate(order.created_at)}</p>
                {order.receipt_sent_at && (
                  <p className="muted">
                    Receipt sent {formatDate(order.receipt_sent_at)}
                  </p>
                )}
              </div>
              <div>
                <p className="order-amount">{formatPrice(order.amount)}</p>
                <p className="muted">
                  {order.payment_method === 'gateway'
                    ? 'Gateway payment'
                    : `GCash ${order.gcash_reference || '—'}`}
                </p>
              </div>
              <div className="order-actions">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => handleMarkPaid(order)}
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
                  onClick={() => handleSendReceipt(order)}
                >
                  Send receipt
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
