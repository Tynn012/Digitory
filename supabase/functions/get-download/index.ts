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

const isExternalUrl = (value: string) => /^https?:\/\//i.test(String(value || ''))

const extractStoragePath = (value: string) => {
  const rawValue = String(value || '').trim()
  if (!rawValue) return ''

  const publicPrefix = '/storage/v1/object/public/product-files/'
  const publicIndex = rawValue.indexOf(publicPrefix)
  if (publicIndex !== -1) {
    return rawValue.slice(publicIndex + publicPrefix.length)
  }

  const signedPrefix = '/storage/v1/object/sign/product-files/'
  const signedIndex = rawValue.indexOf(signedPrefix)
  if (signedIndex !== -1) {
    return rawValue.slice(signedIndex + signedPrefix.length).split('?')[0]
  }

  return rawValue
}

const resolveDownloadUrl = async (downloadUrl: string) => {
  if (!downloadUrl) return ''

  if (isExternalUrl(downloadUrl)) {
    const storagePath = extractStoragePath(downloadUrl)
    if (!storagePath || storagePath === downloadUrl) {
      return downloadUrl
    }

    const { data, error } = await supabase.storage
      .from('product-files')
      .createSignedUrl(storagePath, 300)

    if (error) {
      throw error
    }

    return data?.signedUrl || ''
  }

  const { data, error } = await supabase.storage
    .from('product-files')
    .createSignedUrl(downloadUrl, 300)

  if (error) {
    throw error
  }

  return data?.signedUrl || ''
}

const normalizeCount = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const token = body?.token
    const email = String(body?.email || '').trim().toLowerCase()
    const consume = Boolean(body?.consume)

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data, error } = await supabase
      .from('orders')
      .select(
        'id, product_title, amount, customer_name, buyer_email, download_unlocked, download_url, download_limit, download_count',
      )
      .eq('download_token', token)
      .maybeSingle()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Order not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if ((data.buyer_email || '').trim().toLowerCase() !== email) {
      return new Response(JSON.stringify({ error: 'Email does not match this order.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!data.download_unlocked) {
      return new Response(JSON.stringify({ error: 'Download is not available yet.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const downloadLimit = normalizeCount(data.download_limit, 10)
    const downloadCount = normalizeCount(data.download_count, downloadLimit)

    let nextCount = downloadCount
    if (consume) {
      if (downloadCount <= 0) {
        return new Response(JSON.stringify({ error: 'Your download limit has been reached.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: consumed, error: consumeError } = await supabase
        .rpc('consume_download_attempt', {
          p_download_token: token,
          p_buyer_email: email,
        })
        .single()

      if (consumeError || !consumed) {
        return new Response(JSON.stringify({ error: 'Your download limit has been reached.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      nextCount = normalizeCount(consumed.download_count, downloadCount - 1)
    }

    const resolvedDownloadUrl = consume ? await resolveDownloadUrl(data.download_url) : ''

    return new Response(JSON.stringify({
      order: {
        ...data,
        download_url: resolvedDownloadUrl,
        download_limit: downloadLimit,
        download_count: nextCount,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Request failed.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
