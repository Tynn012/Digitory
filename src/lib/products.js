import { supabase, isSupabaseConfigured } from './supabaseClient'
import { seedProducts } from '../data/products'
import { getStoredValue, setStoredValue } from './storage'

const STORAGE_KEY = 'digitory-products'

const ensureLocalProducts = () => {
  const stored = getStoredValue(STORAGE_KEY, null)
  if (!Array.isArray(stored) || stored.length === 0) {
    setStoredValue(STORAGE_KEY, seedProducts)
    return seedProducts
  }
  return stored
}

const normalizeProduct = (product) => ({
  ...product,
  price: Number(product?.price ?? 0),
  archived: Boolean(product?.archived),
  images: Array.isArray(product?.images) ? product.images : [],
  tags: Array.isArray(product?.tags) ? product.tags : [],
})

export const fetchProducts = async ({ includeArchived = false } = {}) => {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (!includeArchived) {
        query = query.eq('archived', false)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []).map(normalizeProduct)
    } catch {
      return ensureLocalProducts()
        .map(normalizeProduct)
        .filter((product) => includeArchived || !product.archived)
    }
  }

  return ensureLocalProducts()
    .map(normalizeProduct)
    .filter((product) => includeArchived || !product.archived)
}

export const fetchProductBySlug = async (slug) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('archived', false)
        .maybeSingle()

      if (error) throw error
      return data ? normalizeProduct(data) : null
    } catch {
      const local = ensureLocalProducts()
      return local.find((product) => product.slug === slug && !product.archived) || null
    }
  }

  const local = ensureLocalProducts()
  return local.find((product) => product.slug === slug && !product.archived) || null
}

export const saveProduct = async (product) => {
  const payload = normalizeProduct({
    ...product,
    title: product.title?.trim() || '',
    slug: product.slug?.trim() || '',
    archived: Boolean(product.archived),
    category: product.category?.trim() || '',
    description: product.description?.trim() || '',
    thumbnail: product.thumbnail?.trim() || '',
    digital_file_url: product.digital_file_url?.trim() || '',
  })

  if (isSupabaseConfigured && supabase) {
    if (payload.id) {
      const { data, error } = await supabase
        .from('products')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', payload.id)
        .select()
        .single()

      if (error) throw error
      return normalizeProduct(data)
    }

    const insertPayload = { ...payload }
    if (!insertPayload.id) delete insertPayload.id

    const { data, error } = await supabase
      .from('products')
      .insert([insertPayload])
      .select()
      .single()

    if (error) throw error
    return normalizeProduct(data)
  }

  const items = ensureLocalProducts()
  const now = new Date().toISOString()
  if (payload.id) {
    const updated = items.map((item) =>
      item.id === payload.id ? { ...item, ...payload, updated_at: now } : item,
    )
    setStoredValue(STORAGE_KEY, updated)
    return payload
  }

  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `local-${Date.now()}`
  const newProduct = {
    ...payload,
    id,
    created_at: now,
    updated_at: now,
  }
  const next = [newProduct, ...items]
  setStoredValue(STORAGE_KEY, next)
  return newProduct
}

export const deleteProduct = async (id) => {
  // Soft delete: archive product instead of removing it.
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('products')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return true
  }

  const items = ensureLocalProducts()
  const next = items.map((item) =>
    item.id === id
      ? { ...item, archived: true, updated_at: new Date().toISOString() }
      : item,
  )
  setStoredValue(STORAGE_KEY, next)
  return true
}

export const setProductArchived = async (id, archived) => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .update({ archived: Boolean(archived), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return normalizeProduct(data)
  }

  const items = ensureLocalProducts()
  const now = new Date().toISOString()
  const next = items.map((item) =>
    item.id === id ? { ...item, archived: Boolean(archived), updated_at: now } : item,
  )
  setStoredValue(STORAGE_KEY, next)
  return normalizeProduct(next.find((item) => item.id === id) || {})
}
