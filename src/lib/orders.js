import { supabase, isSupabaseConfigured } from './supabaseClient'
import { getStoredValue, setStoredValue } from './storage'

const STORAGE_KEY = 'digitory-orders'

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
  gcash_reference: payload.gcash_reference || '',
  proof_url: payload.proof_url || null,
  status: payload.status || 'pending',
  paid_at: payload.paid_at || null,
  download_unlocked: Boolean(payload.download_unlocked),
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
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
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
