// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data, error } = await supabase
      .from('orders')
      .select('id, product_title, amount, customer_name, buyer_email, download_url')
      .eq('download_token', token)
      .maybeSingle()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!data || !data.download_url) {
      return new Response(JSON.stringify({ error: 'Order not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const upstream = await fetch(data.download_url)
    if (!upstream.ok || !upstream.body) {
      return new Response(JSON.stringify({ error: 'Unable to fetch download.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'

    const safeName = (data.product_title || data.buyer_email || 'download')
      .toString()
      .replace(/[^a-z0-9_\-\.]/gi, '_')
      .slice(0, 120)

    const fileName = `${safeName}.bin`

    return new Response(upstream.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('download-proof error:', e)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
