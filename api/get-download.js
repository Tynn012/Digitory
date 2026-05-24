import { createClient } from '@supabase/supabase-js'

const env = globalThis.process?.env ?? {}

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

const isExternalUrl = (value) => /^https?:\/\//i.test(String(value || ''))

const resolveDownloadUrl = async (supabase, downloadUrl) => {
  if (!downloadUrl) return ''

  if (isExternalUrl(downloadUrl)) {
    return downloadUrl
  }

  const { data, error } = await supabase.storage
    .from('product-files')
    .createSignedUrl(downloadUrl, 300)

  if (error) {
    throw error
  }

  return data?.signedUrl || ''
}

const normalizeCount = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body || {}
  const token = body.token
  const email = (body.email || '').trim().toLowerCase()
  const consume = Boolean(body.consume)

  if (!token) {
    return res.status(400).json({ error: 'Missing token.' })
  }

  if (!email) {
    return res.status(400).json({ error: 'Missing email.' })
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return res.status(500).json({
      error: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    })
  }

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, product_title, amount, customer_name, buyer_email, download_unlocked, download_url, download_limit, download_count',
    )
    .eq('download_token', token)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  if (!data) {
    return res.status(404).json({ error: 'Order not found.' })
  }

  if ((data.buyer_email || '').trim().toLowerCase() !== email) {
    return res.status(403).json({ error: 'Email does not match this order.' })
  }

  if (!data.download_unlocked) {
    return res.status(403).json({ error: 'Download is not available yet.' })
  }

  const downloadLimit = normalizeCount(data.download_limit, 10)
  const downloadCount = normalizeCount(data.download_count, downloadLimit)

  let nextCount = downloadCount
  if (consume) {
    if (downloadCount <= 0) {
      return res.status(403).json({ error: 'Your download limit has been reached.' })
    }

    const { data: consumed, error: consumeError } = await supabase
      .rpc('consume_download_attempt', {
        p_download_token: token,
        p_buyer_email: email,
      })
      .single()

    if (consumeError || !consumed) {
      return res.status(403).json({ error: 'Your download limit has been reached.' })
    }

    nextCount = normalizeCount(consumed.download_count, downloadCount - 1)
  }

  const resolvedDownloadUrl = consume
    ? await resolveDownloadUrl(supabase, data.download_url)
    : ''

  return res.status(200).json({
    order: {
      ...data,
      download_url: resolvedDownloadUrl,
      download_limit: downloadLimit,
      download_count: nextCount,
    },
  })
}
