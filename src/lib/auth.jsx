import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'

const AuthContext = createContext({
  session: null,
  loading: true,
  configMissing: false,
  isAdmin: false,
  adminLoading: false,
  adminError: '',
  signIn: async () => ({ data: null, error: null }),
  signOut: async () => {},
})

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)
  const [adminError, setAdminError] = useState('')
  const configMissing = !isSupabaseConfigured

  useEffect(() => {
    if (configMissing || !supabase) {
      setLoading(false)
      return undefined
    }

    supabase.auth.getSession().then(({ data }) => {
      const nextSession = data?.session ?? null
      setSession(nextSession)
      setAdminLoading(Boolean(nextSession))
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => {
        setSession(updatedSession)
        setAdminLoading(Boolean(updatedSession))
      },
    )

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [configMissing])

  useEffect(() => {
    let active = true

    if (configMissing || !supabase) {
      setIsAdmin(false)
      setAdminError('')
      setAdminLoading(false)
      return () => {
        active = false
      }
    }

    if (!session) {
      setIsAdmin(false)
      setAdminError('')
      setAdminLoading(false)
      return () => {
        active = false
      }
    }

    // Avoid admin role checks with expired/invalid sessions.
    const expiresAtMs = (session.expires_at || 0) * 1000
    if (expiresAtMs && expiresAtMs <= Date.now()) {
      setIsAdmin(false)
      setAdminError('Session expired. Please sign in again.')
      setAdminLoading(false)
      supabase.auth.signOut()
      return () => {
        active = false
      }
    }

    setAdminLoading(true)
    supabase
      .from('admin_users')
      .select('user_id, role')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          if (error.status === 401 || error.code === '401' || error.code === 'PGRST301') {
            setAdminError('Session expired. Please sign in again.')
            setIsAdmin(false)
            supabase.auth.signOut()
            return
          }
          setAdminError(
            'Admin role check failed. Ensure schema.sql has been applied.',
          )
          setIsAdmin(false)
          return
        }
        setAdminError('')
        setIsAdmin(Boolean(data))
      })
      .finally(() => {
        if (active) {
          setAdminLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [configMissing, session])

  const signIn = async (email, password) => {
    if (configMissing || !supabase) {
      return { data: null, error: { message: 'Supabase is not configured.' } }
    }

    return supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const value = useMemo(
    () => ({
      session,
      loading,
      configMissing,
      isAdmin,
      adminLoading,
      adminError,
      signIn,
      signOut,
    }),
    [session, loading, configMissing, isAdmin, adminLoading, adminError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
