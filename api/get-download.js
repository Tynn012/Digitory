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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body || {}
  const token = body.token

  if (!token) {
    return res.status(400).json({ error: 'Missing token.' })
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
      'id, product_title, amount, customer_name, buyer_email, download_unlocked, download_url',
    )
    .eq('download_token', token)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  if (!data) {
    return res.status(404).json({ error: 'Order not found.' })
  }

  return res.status(200).json({ order: data })
}
