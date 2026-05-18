import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { Resend } from 'npm:resend@4.0.0'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

type Payload = {
  orderId: string
  email?: string
  customerName?: string
  productTitle?: string
  amount?: string | number
  downloadToken?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  let payload: Payload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const { orderId } = payload
  if (!orderId) {
    return new Response(JSON.stringify({ error: '`orderId` is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL')
  const SITE_URL = Deno.env.get('SITE_URL')

  if (!RESEND_API_KEY || !FROM_EMAIL || !SITE_URL) {
    return new Response(
      JSON.stringify({
        error: 'Missing one of required secrets: RESEND_API_KEY, FROM_EMAIL, SITE_URL',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing one of required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, buyer_email, customer_name, product_title, amount, download_token')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const to = order.buyer_email || payload.email
  if (!to) {
    return new Response(JSON.stringify({ error: '`buyer_email` is missing for this order' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const downloadUrl = order.download_token
    ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1/download-proof?token=${encodeURIComponent(order.download_token)}`
    : null

  if (!downloadUrl) {
    return new Response(JSON.stringify({ error: '`download_token` is missing for this order' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const customerName = order.customer_name ?? payload.customerName ?? 'there'
  const productTitle = order.product_title ?? payload.productTitle ?? 'your purchase'
  const amount = order.amount != null ? order.amount.toString() : (payload.amount?.toString() || '')

  const subject = `Your receipt & download link: ${productTitle}`
  const text = `Hi ${customerName},\n\nThanks for your purchase of \"${productTitle}\"!\n\nAmount: ${amount}\nDownload link: ${downloadUrl}\n\nIf you have any questions, reply to this email.\n\n— ${SITE_URL}`
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f1c20;">
      <h2 style="margin: 0 0 12px;">Hi ${customerName},</h2>
      <p style="margin: 0 0 12px;">Thanks for your purchase of <strong>${productTitle}</strong>.</p>
      <p style="margin: 0 0 12px;"><strong>Amount:</strong> ${amount}</p>
      <p style="margin: 16px 0;">
        <a href="${downloadUrl}" style="display: inline-block; padding: 12px 18px; background: #1bb3a8; color: #fff; text-decoration: none; border-radius: 999px;">
          Download your file
        </a>
      </p>
      <p style="margin: 16px 0;">If the button does not work, use this link:</p>
      <p style="margin: 0 0 12px;"><a href="${downloadUrl}">${downloadUrl}</a></p>
      <p style="margin: 24px 0 0;">- Digitory</p>
    </div>
  `

  const resend = new Resend(RESEND_API_KEY)

  try {
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      text,
      html,
    })

    return new Response(
      JSON.stringify({
        ok: true,
        emailId: emailResult?.id ?? null,
        emailResult,
        downloadUrl,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        details: e,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  }
})
