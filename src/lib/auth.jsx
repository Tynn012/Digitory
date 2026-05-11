import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'

const AuthContext = createContext({
  session: null,
  loading: true,
  configMissing: false,
  signIn: async () => ({ data: null, error: null }),
  signOut: async () => {},
})

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const configMissing = !isSupabaseConfigured

  useEffect(() => {
    if (configMissing || !supabase) {
      setLoading(false)
      return undefined
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => {
        setSession(updatedSession)
      },
    )

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [configMissing])

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
    () => ({ session, loading, configMissing, signIn, signOut }),
    [session, loading, configMissing],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
