import { supabase } from './supabaseClient'

export const sendReceiptEmail = async ({
  orderId,
  email,
  customerName,
  productTitle,
  amount,
  downloadToken,
}) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.functions.invoke('send-receipt', {
    body: { 
      orderId 
    },
  })

  if (error) {
    const rawMessage = (error.message || '').toLowerCase()
    if (rawMessage.includes('failed to send a request to the edge function')) {
      throw new Error(
        'Edge function `send-receipt` is not reachable. Deploy it in Supabase and set RESEND_API_KEY, FROM_EMAIL, and SITE_URL secrets.',
      )
    }
    throw error
  }
  return data
}


