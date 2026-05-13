import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createOrder } from '../lib/orders'
import { fetchProductBySlug } from '../lib/products'
import { formatPrice } from '../lib/format'
import { paymentDetails } from '../data/branding'
import { createQrPlaceholder } from '../data/placeholders'
import { isGatewayMode } from '../lib/paymentMode'

const Checkout = () => {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', reference: '' })
  const [proofFile, setProofFile] = useState(null)
  const isManualMode = !isGatewayMode

  useEffect(() => {
    fetchProductBySlug(slug)
      .then((data) => {
        setProduct(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isGatewayMode) {
      setError('Gateway payments are not configured yet.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const order = await createOrder({
        product_id: product.id || null,
        product_slug: product.slug,
        product_title: product.title,
        amount: product.price,
        customer_name: form.name,
        buyer_email: form.email,
        gcash_reference: isManualMode ? form.reference : '',
        proof_file: isManualMode ? proofFile : null,
        payment_method: isGatewayMode ? 'gateway' : 'manual_gcash',
        download_url: product.digital_file_url || '',
      })
      setSuccess(order)
      setForm({ name: '', email: '', reference: '' })
      setProofFile(null)
    } catch (err) {
      setError(err.message || 'Unable to place order.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loader-wrapper">
        <div className="loader" />
        <p>Loading checkout...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="section container">
        <div className="notice-card">
          <h2>Product not found</h2>
          <p>Choose a product to continue with checkout.</p>
          <Link to="/products" className="button primary">
            Browse products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="container checkout-grid">
        <div className="checkout-card">
          <h2>{isGatewayMode ? 'Online checkout' : 'GCash checkout'}</h2>
          {isManualMode ? (
            <>
              <p>
                Send payment to the GCash details below and submit your reference
                number for verification.
              </p>
              <div className="payment-box">
                <div>
                  <p className="label">GCash number</p>
                  <h3>{paymentDetails.gcash_number}</h3>
                  <p className="muted">{paymentDetails.gcash_name}</p>
                </div>
                <img
                  src={createQrPlaceholder()}
                  alt="GCash QR placeholder"
                  className="qr-placeholder"
                />
              </div>
              <p className="muted">
                Replace the placeholder QR with your real GCash QR image in
                production.
              </p>
            </>
          ) : (
            <div className="notice-card">
              <h3>Gateway mode enabled</h3>
              <p>
                Connect a payment provider to automatically confirm payments.
                This flow is a placeholder until the gateway is configured.
              </p>
            </div>
          )}
          <div className="order-summary">
            <div>
              <h4>{product.title}</h4>
              <p>{product.category}</p>
            </div>
            <span>{formatPrice(product.price)}</span>
          </div>
        </div>
        <div className="checkout-card">
          <h2>Submit payment</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="form-field">
              Name
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                required
              />
            </label>
            <label className="form-field">
              Email
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                required
              />
            </label>
            {isManualMode && (
              <label className="form-field">
                GCash reference number
                <input
                  type="text"
                  value={form.reference}
                  onChange={handleChange('reference')}
                  required
                />
              </label>
            )}
            {isManualMode && (
              <label className="form-field">
                Proof of payment (optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setProofFile(event.target.files?.[0] || null)
                  }
                />
              </label>
            )}
            {error && <p className="form-error">{error}</p>}
            {success && (
              <div className="success-card">
                <h4>Order received</h4>
                <p>
                  We are verifying your payment. We will email your download link
                  once it is approved.
                </p>
              </div>
            )}
            <button
              type="submit"
              className="button primary"
              disabled={submitting || isGatewayMode}
            >
              {submitting
                ? 'Submitting...'
                : isGatewayMode
                  ? 'Gateway setup required'
                  : 'Submit payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Checkout
