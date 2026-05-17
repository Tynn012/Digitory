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

  const { data, error } = await supabase.functions.invoke('send-emails-resend', {
    body: { orderId },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (error) throw error
  return data
}