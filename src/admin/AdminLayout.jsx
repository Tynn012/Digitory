import { Outlet } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from './AdminSidebar'
import {
  getAdminAllowlist,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabaseClient'
import { useBranding } from '../lib/branding'

const AdminLayout = () => {
  const { branding } = useBranding()
  const brandName = branding.site_name || 'Digitory'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authStep, setAuthStep] = useState('password')
  const [mfaReady, setMfaReady] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaQrCode, setMfaQrCode] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
  const [mfaUri, setMfaUri] = useState('')
  const allowlist = useMemo(() => getAdminAllowlist(), [])
  const hasSupabase = isSupabaseConfigured && Boolean(supabase)

  const resetMfaState = () => {
    setMfaReady(false)
    setAuthStep('password')
    setMfaCode('')
    setMfaFactorId('')
    setMfaQrCode('')
    setMfaSecret('')
    setMfaUri('')
  }

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return () => {}
    }

    let isMounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) {
        return
      }

      if (data.session) {
        const { data: aalData } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aalData?.currentLevel !== 'aal2') {
          await supabase.auth.signOut()
          setSession(null)
          setIsLoading(false)
          return
        }
      }

      setSession(data.session ?? null)
      setIsLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return
      }
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const isAllowed =
    session &&
    (allowlist.length === 0 ||
      allowlist.includes(session.user.email?.toLowerCase() || ''))

  useEffect(() => {
    if (!supabase) {
      return () => {}
    }

    let isActive = true
    const checkAllowed = async () => {
      if (session && !isAllowed) {
        await supabase.auth.signOut()
        if (isActive) {
          setAuthError('This account is not on the admin allowlist.')
        }
      }
    }

    checkAllowed()
    return () => {
      isActive = false
    }
  }, [session, isAllowed])

  useEffect(() => {
    if (!session) {
      const id = setTimeout(() => resetMfaState(), 0)
      return () => clearTimeout(id)
    }
    return undefined
  }, [session])

  useEffect(() => {
    if (!supabase) {
      return () => {}
    }

    if (!session || !isAllowed || mfaReady || authStep !== 'password' || mfaFactorId) {
      return () => {}
    }

    let isActive = true

    const prepareMfa = async () => {
      try {
        const { data: aalData, error: aalError } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

        if (!isActive) {
          return
        }

        if (aalError) {
          setAuthError(aalError.message)
          return
        }

        if (aalData?.currentLevel === 'aal2') {
          setMfaReady(true)
          return
        }

        const { data: factorData, error: factorError } =
          await supabase.auth.mfa.listFactors()

        if (!isActive) {
          return
        }

        if (factorError) {
          setAuthError(factorError.message)
          return
        }

        const existingFactor =
          factorData?.all?.[0] || factorData?.totp?.[0] || null

        if (existingFactor?.id && existingFactor?.status === 'verified') {
          setMfaFactorId(existingFactor.id)
          setAuthStep('verify')
          setMfaCode('')
          return
        }

        if (existingFactor?.id && existingFactor?.status !== 'verified') {
          const { error: deleteError } =
            await supabase.auth.mfa.unenroll({ factorId: existingFactor.id })

          if (deleteError) {
            setAuthError(
              deleteError.message || 'Unable to remove existing factor.',
            )
            return
          }
        }

        const { data: enrollData, error: enrollError } =
          await supabase.auth.mfa.enroll({
            factorType: 'totp',
            friendlyName: `${brandName} admin`,
          })

        if (!isActive) {
          return
        }

        if (enrollError) {
          setAuthError(enrollError.message)
          return
        }

        setMfaFactorId(enrollData.id)
        setMfaQrCode(enrollData.totp?.qr_code || '')
        setMfaSecret(enrollData.totp?.secret || '')
        setMfaUri(enrollData.totp?.uri || '')
        setAuthStep('enroll')
        setMfaCode('')
      } catch (err) {
        if (isActive) {
          setAuthError(err.message || 'Unable to prepare two-factor authentication.')
        }
      }
    }

    prepareMfa()

    return () => {
      isActive = false
    }
  }, [session, isAllowed, mfaReady, authStep, brandName, mfaFactorId])

  const handleLogin = async (event) => {
    event.preventDefault()
    setAuthError('')
    setIsSubmitting(true)

    try {
      if (!supabase) {
        setAuthError('Supabase is not configured.')
        return
      }

      if (authStep === 'enroll' || authStep === 'verify') {
        if (!mfaFactorId) {
          setAuthError('Two-factor setup is not ready yet. Please try again.')
          return
        }

        const { error } = await supabase.auth.mfa.challengeAndVerify({
          factorId: mfaFactorId,
          code: mfaCode,
        })

        if (error) {
          setAuthError(error.message || 'Invalid authentication code.')
          setMfaCode('')
          return
        }

        setMfaReady(true)
        setAuthStep('authenticated')
        setMfaCode('')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setAuthError(error.message)
        return
      }

      setPassword('')
    } catch (err) {
      setAuthError(err.message || 'Sign in failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  if (isLoading) {
    return (
      <div className="admin-shell">
        <section className="admin-content">
          <div className="admin-top">
            <h1>Loading admin</h1>
            <p>Checking your secure session.</p>
          </div>
          <div className="loader-wrapper">
            <div className="loader" />
          </div>
        </section>
      </div>
    )
  }

  if (!hasSupabase) {
    return (
      <div className="admin-shell">
        <section className="admin-content">
          <div className="admin-top">
            <h1>Supabase setup required</h1>
            <p>
              Add <strong>VITE_SUPABASE_URL</strong> and
              <strong> VITE_SUPABASE_ANON_KEY</strong> to your environment to
              enable admin sign-in.
            </p>
          </div>
        </section>
      </div>
    )
  }

  if (!session || !isAllowed || !mfaReady) {
    return (
      <div className="admin-shell">
        <section className="admin-content">
          <div className="login-page">
            <div className="auth-card">
              <h2>
                {authStep === 'enroll'
                  ? 'Set up authenticator'
                  : authStep === 'verify'
                    ? 'Verify your identity'
                    : 'Secure admin access'}
              </h2>
              <p>
                {authStep === 'enroll'
                  ? 'Scan the QR code, then enter the 6-digit code to finish setup.'
                  : authStep === 'verify'
                    ? 'Enter the 6-digit code from your authenticator app.'
                    : `Enter your credentials to manage ${brandName}.`}
              </p>

              {authStep === 'enroll' && (
                <section className="mfa-setup-card">
                  <div className="mfa-setup-grid">
                    <div className="mfa-qr-frame">
                      {mfaQrCode ? (
                        <img src={mfaQrCode} alt="Authenticator QR code" />
                      ) : (
                        <p>Loading QR code...</p>
                      )}
                    </div>
                    <div className="mfa-secret-card">
                      <span>Manual entry key</span>
                      <strong>{mfaSecret || 'Waiting for secret...'}</strong>
                      {mfaUri && <p>{mfaUri}</p>}
                    </div>
                  </div>
                </section>
              )}

              <form onSubmit={handleLogin} className="form-grid">
                <label className="form-field">
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setAuthError('')
                    }}
                    required
                    autoComplete="email"
                    disabled={isSubmitting}
                  />
                </label>

                {authStep === 'password' && (
                  <label className="form-field">
                    Password
                    <div className="input-row">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value)
                          setAuthError('')
                        }}
                        required
                        autoComplete="current-password"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className="button ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>
                )}

                {(authStep === 'enroll' || authStep === 'verify') && (
                  <label className="form-field">
                    Two-factor code
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(event) => {
                        setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                        setAuthError('')
                      }}
                      placeholder="000000"
                      maxLength="6"
                      autoComplete="off"
                      required
                      disabled={isSubmitting}
                    />
                  </label>
                )}

                {authError && <p className="form-error">{authError}</p>}

                <button type="submit" className="button primary" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Signing in...'
                    : authStep === 'enroll'
                      ? 'Finish setup'
                      : authStep === 'verify'
                        ? 'Verify code'
                        : 'Sign in'}
                </button>

                {(authStep === 'enroll' || authStep === 'verify') && (
                  <button
                    type="button"
                    className="button ghost"
                    onClick={async () => {
                      await supabase.auth.signOut()
                      resetMfaState()
                      setEmail('')
                      setPassword('')
                      setAuthError('')
                    }}
                    disabled={isSubmitting}
                  >
                    Back to login
                  </button>
                )}
              </form>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <AdminSidebar onSignOut={handleLogout} />
      <section className="admin-content">
        <div className="admin-top">
          <h1>Admin</h1>
          <p>Manage products, orders, and the Digitory brand experience.</p>
        </div>
        <Outlet />
      </section>
    </div>
  )
}

export default AdminLayout
