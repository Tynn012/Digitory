import { useEffect, useState } from 'react'
import { useBranding } from '../lib/branding'

const AdminBranding = () => {
  const { branding, saveBranding } = useBranding()
  const [draft, setDraft] = useState(branding)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(branding)
  }, [branding])

  const handleChange = (field) => (event) => {
    setDraft((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    await saveBranding(draft)
    setSaving(false)
  }

  return (
    <section className="admin-card">
      <h3>Branding</h3>
      <form onSubmit={handleSubmit} className="form-grid">
        <label className="form-field">
          Website name
          <input
            type="text"
            value={draft.site_name || ''}
            onChange={handleChange('site_name')}
          />
        </label>
        <label className="form-field">
          Hero title
          <input
            type="text"
            value={draft.hero_title || ''}
            onChange={handleChange('hero_title')}
          />
        </label>
        <label className="form-field">
          Hero subtitle
          <textarea
            rows="3"
            value={draft.hero_subtitle || ''}
            onChange={handleChange('hero_subtitle')}
          />
        </label>
        <label className="form-field">
          Logo URL
          <input
            type="text"
            value={draft.logo_url || ''}
            onChange={handleChange('logo_url')}
          />
        </label>
        <label className="form-field">
          Accent color
          <input
            type="text"
            value={draft.accent_primary || ''}
            onChange={handleChange('accent_primary')}
          />
        </label>
        <label className="form-field">
          Accent secondary
          <input
            type="text"
            value={draft.accent_secondary || ''}
            onChange={handleChange('accent_secondary')}
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="button primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save branding'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default AdminBranding
