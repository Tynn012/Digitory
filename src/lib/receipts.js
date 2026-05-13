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
      orderId,
      email,
      customerName,
      productTitle,
      amount,
      downloadToken,
    },
  })

  if (error) throw error
  return data
}
