import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DEFAULT_DOWNLOAD_LIMIT, fetchDownloadDetails, fetchDownloadFile } from '../lib/orders'
import { formatPrice } from '../lib/format'

const Download = () => {
  const { token } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Missing download token.')
      setLoading(false)
      return
    }

    if (!emailSubmitted) {
      setLoading(false)
      return
    }

    fetchDownloadDetails(token, email)
      .then((data) => {
        setOrder(data?.order || null)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Unable to load download.')
        setLoading(false)
      })
  }, [token, emailSubmitted, email])

  const handleVerify = (event) => {
    event.preventDefault()
    setError('')
    setOrder(null)
    setLoading(true)
    setEmailSubmitted(true)
  }

  const handleDownload = async () => {
    if (!token || !email) return

    setDownloading(true)
    setError('')

    try {
      const data = await fetchDownloadFile(token, email)
      const downloadUrl = data?.order?.download_url

      if (!downloadUrl) {
        throw new Error('Unable to prepare the download link.')
      }

      window.location.assign(downloadUrl)
    } catch (err) {
      setError(err.message || 'Unable to start the download.')
    } finally {
      setDownloading(false)
    }
  }

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
      <div className="section container download-page">
        <div className="notice-card">
          <h2>Download unavailable</h2>
          <p>{error || 'Enter the buyer email used for the purchase to continue.'}</p>
          {!emailSubmitted ? (
            <form onSubmit={handleVerify} className="form-grid">
              <label className="form-field">
                Purchase email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <div className="download-card-actions">
                <button type="submit" className="button primary">
                  Verify download
                </button>
                <Link to="/products" className="button ghost">
                  Browse products
                </Link>
              </div>
            </form>
          ) : (
            <div className="download-card-actions">
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  setEmailSubmitted(false)
                  setOrder(null)
                  setError('')
                }}
              >
                Try another email
              </button>
              <Link to="/products" className="button ghost">
                Browse products
              </Link>
            </div>
          )}
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
            {order.download_unlocked ? (
              <button
                type="button"
                className="button primary"
                onClick={handleDownload}
                disabled={downloading || Number(order.download_count || 0) <= 0}
              >
                {downloading ? 'Preparing download...' : 'Download file'}
              </button>
            ) : (
              <span className="muted">Download link will appear here.</span>
            )}
            <Link to="/products" className="button ghost">
              Back to store
            </Link>
          </div>
          <p className="muted">
            {Number(order.download_count || 0) > 0
              ? `${Math.min(Number(order.download_count || 0), DEFAULT_DOWNLOAD_LIMIT)} of ${order.download_limit || DEFAULT_DOWNLOAD_LIMIT} downloads remaining.`
              : 'Your download limit has been reached.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Download
