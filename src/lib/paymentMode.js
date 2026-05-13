const rawMode = (import.meta.env.VITE_PAYMENT_MODE || 'manual').toLowerCase()

export const PAYMENT_MODE = rawMode === 'gateway' ? 'gateway' : 'manual'
export const isGatewayMode = PAYMENT_MODE === 'gateway'
