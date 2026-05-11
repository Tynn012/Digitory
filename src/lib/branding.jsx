import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { defaultBranding } from '../data/branding'
import { getStoredValue, setStoredValue } from './storage'
import { supabase, isSupabaseConfigured } from './supabaseClient'

const STORAGE_KEY = 'digitory-branding'

const normalizeBranding = (branding) => ({
  ...defaultBranding,
  ...branding,
})

const applyBranding = (branding) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--accent', branding.accent_primary)
  root.style.setProperty('--accent-2', branding.accent_secondary)
}

export const getBranding = async () => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('branding')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return normalizeBranding(data || defaultBranding)
    } catch {
      return normalizeBranding(getStoredValue(STORAGE_KEY, defaultBranding))
    }
  }

  return normalizeBranding(getStoredValue(STORAGE_KEY, defaultBranding))
}

export const saveBranding = async (branding) => {
  const payload = normalizeBranding(branding)

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('branding')
      .insert([{ ...payload }])
      .select()
      .single()
    if (error) throw error
    return normalizeBranding(data)
  }

  setStoredValue(STORAGE_KEY, payload)
  return payload
}

const BrandingContext = createContext({
  branding: defaultBranding,
  loading: true,
  saveBranding: async () => {},
})

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(defaultBranding)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getBranding()
      .then((data) => {
        if (mounted) {
          setBranding(data)
          setLoading(false)
          applyBranding(data)
        }
      })
      .catch(() => {
        if (mounted) {
          setBranding(defaultBranding)
          setLoading(false)
          applyBranding(defaultBranding)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  const handleSave = async (next) => {
    const saved = await saveBranding(next)
    setBranding(saved)
    applyBranding(saved)
    return saved
  }

  const value = useMemo(
    () => ({ branding, loading, saveBranding: handleSave }),
    [branding, loading],
  )

  return (
    <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
