const parseJSON = (value, fallback) => {
  try {
    return JSON.parse(value) ?? fallback
  } catch {
    return fallback
  }
}

export const getStoredValue = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  return parseJSON(raw, fallback)
}

export const setStoredValue = (key, value) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}
