// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase service role credentials.')
}

const supabase = createClient(supabaseUrl, serviceKey)

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { orderId, email } = await req.json()

    if (!orderId || !email) {
      return new Response(JSON.stringify({ error: 'Missing orderId or email.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, customer_name, product_title, amount, download_token')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!order.download_token) {
      return new Response(JSON.stringify({ error: 'Order has no download token.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const invokeBase = `${supabaseUrl}/functions/v1/send-receipt`
    const { error: invokeError } = await fetch(invokeBase, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: order.id,
        email,
        customerName: order.customer_name,
        productTitle: order.product_title,
        amount: order.amount,
        downloadToken: order.download_token,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const detail = await res.text()
        return { error: detail || 'Failed to send download email.' }
      }
      return { error: null }
    })

    if (invokeError) {
      return new Response(JSON.stringify({ error: 'Email send failed.', detail: invokeError }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', order.id)

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Email sent but failed to update order.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Request failed.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
