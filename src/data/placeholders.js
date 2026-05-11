const themes = {
  mint: { bg: 'E8FBF7', accent: '1BB3A8', ink: '0F3F3A' },
  coral: { bg: 'FFF0E8', accent: 'FF8A5B', ink: '4B2C20' },
  sun: { bg: 'FFF7DB', accent: 'F6C945', ink: '4B3C12' },
  sky: { bg: 'EAF5FF', accent: '2F8DF5', ink: '0E3559' },
}

export const createPlaceholderImage = (label, theme = 'mint') => {
  const palette = themes[theme] || themes.mint
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#${palette.bg}"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="900" height="600" rx="48" fill="url(#bg)"/>
  <rect x="64" y="80" width="260" height="12" rx="6" fill="#${palette.accent}" opacity="0.35"/>
  <rect x="64" y="108" width="340" height="10" rx="5" fill="#${palette.accent}" opacity="0.2"/>
  <circle cx="730" cy="160" r="90" fill="#${palette.accent}" opacity="0.15"/>
  <circle cx="780" cy="190" r="50" fill="#${palette.accent}" opacity="0.25"/>
  <rect x="64" y="360" width="480" height="28" rx="14" fill="#${palette.accent}" opacity="0.18"/>
  <text x="64" y="320" font-family="Trebuchet MS, Arial, sans-serif" font-size="42" fill="#${palette.ink}">
    ${label}
  </text>
  <text x="64" y="420" font-family="Trebuchet MS, Arial, sans-serif" font-size="20" fill="#${palette.ink}" opacity="0.65">
    Digital template preview
  </text>
</svg>
  `.trim()

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const createQrPlaceholder = () => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <rect width="240" height="240" rx="24" fill="#f7f7f2"/>
  <rect x="20" y="20" width="60" height="60" rx="8" fill="#1b1b1f"/>
  <rect x="160" y="20" width="60" height="60" rx="8" fill="#1b1b1f"/>
  <rect x="20" y="160" width="60" height="60" rx="8" fill="#1b1b1f"/>
  <rect x="100" y="100" width="40" height="40" rx="6" fill="#1bb3a8"/>
  <rect x="100" y="40" width="20" height="20" fill="#1b1b1f"/>
  <rect x="140" y="100" width="20" height="20" fill="#1b1b1f"/>
  <rect x="80" y="120" width="20" height="20" fill="#1b1b1f"/>
  <rect x="120" y="160" width="20" height="20" fill="#1b1b1f"/>
  <rect x="140" y="140" width="20" height="20" fill="#1b1b1f"/>
  <rect x="100" y="200" width="20" height="20" fill="#1b1b1f"/>
</svg>
  `.trim()

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
