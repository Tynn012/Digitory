import { supabase, isSupabaseConfigured } from './supabaseClient'
import { getStoredValue, setStoredValue } from './storage'

const STORAGE_KEY = 'digitory-orders'

const createDownloadToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `dl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const ensureLocalOrders = () => {
  const stored = getStoredValue(STORAGE_KEY, null)
  if (!Array.isArray(stored)) {
    setStoredValue(STORAGE_KEY, [])
    return []
  }
  return stored
}

const createOrderPayload = (payload) => ({
  product_id: payload.product_id || null,
  product_slug: payload.product_slug || '',
  product_title: payload.product_title || '',
  amount: Number(payload.amount || 0),
  customer_name: payload.customer_name || '',
  buyer_email: payload.buyer_email ? payload.buyer_email.trim().toLowerCase() : '',
  gcash_reference: payload.gcash_reference || '',
  proof_url: payload.proof_url || null,
  status: payload.status || 'pending',
  paid_at: payload.paid_at || null,
  download_unlocked: Boolean(payload.download_unlocked),
  download_token: payload.download_token || createDownloadToken(),
  download_url: payload.download_url ? payload.download_url.trim() : '',
  payment_method: payload.payment_method || 'manual_gcash',
  receipt_sent_at: payload.receipt_sent_at || null,
  metadata: payload.metadata || {},
})

const uploadProof = async (file, orderId) => {
  if (!supabase) return null
  const extension = file.name.split('.').pop() || 'png'
  const path = `orders/${orderId}.${extension}`
  const { error } = await supabase
    .storage
    .from('order-proofs')
    .upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('order-proofs').getPublicUrl(path)
  return data?.publicUrl || null
}

export const createOrder = async (payload) => {
  const orderPayload = createOrderPayload(payload)

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .insert([{ ...orderPayload }])
      .select()
      .single()

    if (error) throw error

    if (payload.proof_file) {
      const proofUrl = await uploadProof(payload.proof_file, data.id)
      if (proofUrl) {
        const { data: updated } = await supabase
          .from('orders')
          .update({ proof_url: proofUrl })
          .eq('id', data.id)
          .select()
          .single()
        return updated || data
      }
    }

    return data
  }

  const orders = ensureLocalOrders()
  const now = new Date().toISOString()
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `local-${Date.now()}`
  const localOrder = {
    id,
    created_at: now,
    updated_at: now,
    ...orderPayload,
    proof_name: payload.proof_file?.name || null,
  }
  const next = [localOrder, ...orders]
  setStoredValue(STORAGE_KEY, next)
  return localOrder
}

export const fetchOrders = async () => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (err) {
      // If Supabase fails, fall back to local seeded orders for development
      return ensureLocalOrders()
    }
  }

  return ensureLocalOrders()
}

export const updateOrder = async (id, updates) => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const orders = ensureLocalOrders()
  const now = new Date().toISOString()
  const next = orders.map((order) =>
    order.id === id ? { ...order, ...updates, updated_at: now } : order,
  )
  setStoredValue(STORAGE_KEY, next)
  return next.find((order) => order.id === id)
}

export const deleteOrder = async (id) => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) throw error
    return true
  }

  const orders = ensureLocalOrders()
  const next = orders.filter((order) => order.id !== id)
  setStoredValue(STORAGE_KEY, next)
  return true
}

export const fetchDownloadDetails = async (token) => {
  const response = await fetch('/api/get-download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || 'Unable to load download details.')
  }
  return data
}

export { createDownloadToken }
