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

  // Get the current user token
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError

  const accessToken = sessionData?.session?.access_token
  if (!accessToken) {
    throw new Error('User not logged in: cannot invoke authenticated Edge Function without a JWT.')
  }

  // Invoke Edge Function
  const { data, error } = await supabase.functions.invoke('send-emails-resend', {
    body: {
      orderId,
      // These are optional; your Edge Function can ignore them if it reads from the DB
      email,
      customerName,
      productTitle,
      amount,
      downloadToken,
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (error) {
    // surface more context to UI/devtools
    console.error('send-emails-resend invoke failed:', error)
    throw new Error(error.message || 'Failed to invoke send-emails-resend.')
  }

  // helpful for debugging “receipt sent” vs real delivery
  console.log('send-emails-resend response:', data)

  return data
}