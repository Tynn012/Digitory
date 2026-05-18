import { supabase } from './supabaseClient'

export const sendReceiptEmail = async ({
  orderId,
  email,
  customerName,
  productTitle,
  amount,
  downloadToken,
}) => {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError

  const accessToken = sessionData?.session?.access_token
  if (!accessToken) {
    throw new Error('User not logged in: cannot send receipts without a valid session.')
  }

  const response = await fetch('/api/send-receipt', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderId,
      email,
      customerName,
      productTitle,
      amount,
      downloadToken,
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to send receipt email.')
  }

  return data
}