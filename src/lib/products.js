import { supabase, isSupabaseConfigured } from './supabaseClient'
import { seedProducts } from '../data/products'
import { getStoredValue, setStoredValue } from './storage'

const STORAGE_KEY = 'digitory-products'

// 🔥 DEMO LOGIC - toggle USE_DEMO to switch between demo and real API logic
import { mockProducts } from '../data/mockProducts'

const USE_DEMO = true // 🔥 toggle this

export const fetchProducts = async () => {
  if (USE_DEMO) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockProducts), 600) // simulate loading
    })
  }

  // real API logic here
  const res = await fetch('/api/products')
  return res.json()
}

export const fetchProductBySlug = async (slug) => {
  if (USE_DEMO) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockProducts.find((p) => p.slug === slug))
      }, 400)
    })
  }

  const res = await fetch(`/api/products/${slug}`)
  return res.json()
}
// End of demo logic

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
  images: Array.isArray(product?.images) ? product.images : [],
  tags: Array.isArray(product?.tags) ? product.tags : [],
})

export const fetchProducts = async () => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map(normalizeProduct)
    } catch {
      return ensureLocalProducts().map(normalizeProduct)
    }
  }

  return ensureLocalProducts().map(normalizeProduct)
}

export const fetchProductBySlug = async (slug) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (error) throw error
      return data ? normalizeProduct(data) : null
    } catch {
      const local = ensureLocalProducts()
      return local.find((product) => product.slug === slug) || null
    }
  }

  const local = ensureLocalProducts()
  return local.find((product) => product.slug === slug) || null
}

export const saveProduct = async (product) => {
  const payload = normalizeProduct({
    ...product,
    title: product.title?.trim() || '',
    slug: product.slug?.trim() || '',
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

    const { data, error } = await supabase
      .from('products')
      .insert([{ ...payload }])
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
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
    return true
  }

  const items = ensureLocalProducts()
  const next = items.filter((item) => item.id !== id)
  setStoredValue(STORAGE_KEY, next)
  return true
}
