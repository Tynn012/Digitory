import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const env = globalThis.process?.env ?? {}
const isProduction = env.NODE_ENV === 'production'

const isEmailConfigured = () =>
  Boolean(env.SMTP_HOST) && Boolean(env.SMTP_USER) && Boolean(env.SMTP_PASS)

const getAllowlist = () => {
  const raw = env.ADMIN_EMAILS || env.VITE_ADMIN_EMAILS || ''
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

const getSupabaseClient = () => {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

const getBaseUrl = (req) => {
  if (env.SITE_URL) {
    return env.SITE_URL.replace(/\/$/, '')
  }

  const proto = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  if (!host) return ''

  return `${proto}://${host}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body || {}
  const orderId = body.orderId

  if (!orderId) {
       const text = `Hi ${safeName},\n\nThanks for your purchase! Your download is ready. Open the link and verify with your purchase email to continue.\n\nDownload: ${downloadLink}\n\nAmount: ${amount || ''}\n\nIf you need help, reply to this email.\n\n- Digitory`
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return res.status(500).json({
      error: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    })
  }

  const authHeader = req.headers.authorization || ''
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!accessToken) {
    return res.status(401).json({ error: 'Missing authorization token.' })
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !userData?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized request.' })
  }

  const allowlist = getAllowlist()
  if (
    allowlist.length > 0 &&
    !allowlist.includes(userData.user.email.toLowerCase())
  ) {
    return res.status(403).json({ error: 'Admin access required.' })
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, buyer_email, customer_name, product_title, amount, download_token')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return res.status(404).json({ error: 'Order not found.' })
  }

  const toEmail = order.buyer_email || body.email
  if (!toEmail) {
    return res.status(400).json({ error: 'Missing buyer email.' })
  }

  const downloadToken = order.download_token || body.downloadToken
  if (!downloadToken) {
    return res.status(400).json({ error: 'Missing download token.' })
  }

  const baseUrl = getBaseUrl(req)
  if (!baseUrl) {
    return res.status(500).json({ error: 'Missing site URL configuration.' })
  }
  const downloadLink = `${baseUrl}/download/${downloadToken}`
  const safeTitle = order.product_title || body.productTitle || 'your purchase'
  const safeName = order.customer_name || body.customerName || 'there'
  const amount = order.amount != null ? order.amount : body.amount
  const amountText = amount != null ? amount.toString() : ''

  const subject = `Your Digitory receipt: ${safeTitle}`
  const text = `Hi ${safeName},\n\nThanks for your purchase of "${safeTitle}". Your payment is confirmed. Open the link and verify with your purchase email to continue. This download can be used up to 10 times.\n\nAmount: ${amountText}\nDownload link (keep this private): ${downloadLink}\n\nIf you have any questions, reply to this email.\n\n- Digitory`
  const html = `
    <div style="background: #f6f7f5; padding: 24px; font-family: Arial, sans-serif; color: #0f1c20;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e7e7e0; padding: 28px;">
        <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #1bb3a8; font-weight: 700;">Digitory</p>
        <h2 style="margin: 0 0 8px;">Receipt and download link</h2>
        <p style="margin: 0 0 16px; color: #5a6466;">Hi ${safeName}, thanks for your purchase. Your payment is confirmed. Open the link and verify with your purchase email to continue. This download can be used up to 10 times.</p>

        <div style="border: 1px solid #e7e7e0; border-radius: 14px; padding: 16px; background: #fafaf9; margin: 16px 0;">
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #5a6466;">Product</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600;">${safeTitle}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #5a6466;">Amount</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600;">${amountText}</td>
            </tr>
          </table>
        </div>

        <p style="margin: 16px 0 6px; font-weight: 600;">Download your file</p>
        <p style="margin: 0 0 16px; color: #5a6466;">Keep this link private. Anyone with it can access the download.</p>
        <p style="margin: 0 0 18px;">
          <a href="${downloadLink}" style="display: inline-block; padding: 12px 20px; background: #1bb3a8; color: #fff; text-decoration: none; border-radius: 999px; font-weight: 600;">Download</a>
        </p>

        <p style="margin: 0 0 8px; color: #5a6466;">If the button does not work, use this link:</p>
        <p style="margin: 0 0 20px;"><a href="${downloadLink}" style="color: #1bb3a8; word-break: break-all;">${downloadLink}</a></p>
        <p style="margin: 0; color: #5a6466;">Questions? Reply to this email.</p>
      </div>
    </div>
  `

  const emailConfigured = isEmailConfigured()
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 465),
    secure: String(env.SMTP_SECURE || 'true') === 'true',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })

  const fromEmail = env.MAIL_FROM || env.SMTP_USER || env.MAIL_TO || toEmail

  if (!emailConfigured) {
    if (!isProduction) {
      return res.status(200).json({ ok: true, preview: true })
    }

    return res.status(500).json({
      error: 'Email delivery is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.',
    })
  }

  try {
    await transporter.sendMail({
      to: toEmail,
      from: fromEmail,
      subject,
      text,
      html,
      replyTo: fromEmail,
    })

    return res.status(200).json({ ok: true, downloadLink })
  } catch (error) {
    console.error('Email delivery failed:', {
      message: error?.message || String(error),
      code: error?.code || null,
      response: error?.response || null,
      responseCode: error?.responseCode || null,
      command: error?.command || null,
    })

    if (!isProduction) {
      return res.status(500).json({
        error: 'Email delivery failed.',
        detail: error?.message || String(error),
        code: error?.code || null,
        response: error?.response || null,
      })
    }

    return res.status(500).json({ error: 'Email delivery failed.' })
  }
}
