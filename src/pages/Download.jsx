import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchDownloadDetails } from '../lib/orders'
import { formatPrice } from '../lib/format'

const Download = () => {
  const { token } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Missing download token.')
      setLoading(false)
      return
    }

    fetchDownloadDetails(token)
      .then((data) => {
        setOrder(data?.order || null)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Unable to load download.')
        setLoading(false)
      })
  }, [token])

  if (loading) {
    return (
      <div className="loader-wrapper">
        <div className="loader" />
        <p>Preparing your download...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="section container">
        <div className="notice-card">
          <h2>Download unavailable</h2>
          <p>{error || 'This download link is invalid or expired.'}</p>
          <Link to="/products" className="button primary">
            Browse products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="container download-grid">
        <div className="checkout-card">
          <h2>{order.download_unlocked ? 'Download ready' : 'Payment pending'}</h2>
          <p>
            {order.download_unlocked
              ? 'Your payment was verified. You can download your file below.'
              : 'We are still verifying your payment. You will receive an email once it is approved.'}
          </p>
          <div className="order-summary">
            <div>
              <h4>{order.product_title}</h4>
              <p>{order.customer_name}</p>
              {order.buyer_email && <p className="muted">{order.buyer_email}</p>}
            </div>
            <span>{formatPrice(order.amount)}</span>
          </div>
          <div className="download-actions">
            {order.download_unlocked && order.download_url ? (
              <a
                className="button primary"
                href={order.download_url}
                target="_blank"
                rel="noreferrer"
              >
                Download file
              </a>
            ) : (
              <span className="muted">Download link will appear here.</span>
            )}
            <Link to="/products" className="button ghost">
              Back to store
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Download
