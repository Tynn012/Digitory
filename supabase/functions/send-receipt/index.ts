// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

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
    const { email, customerName, productTitle, amount, downloadToken } =
      await req.json()

    if (!email || !downloadToken) {
      return new Response(JSON.stringify({ error: 'Missing email or token.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL')
    const siteUrl = Deno.env.get('SITE_URL')

    if (!resendKey || !fromEmail || !siteUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing email configuration.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const baseUrl = siteUrl.replace(/\/$/, '')
    const downloadLink = `${baseUrl}/download/${downloadToken}`
    const safeTitle = productTitle || 'your purchase'
    const safeName = customerName || 'there'

    const subject = `Your Digitory download is ready: ${safeTitle}`
    const text = `Hi ${safeName},\n\nThanks for your purchase! Your download is ready.\n\nDownload: ${downloadLink}\n\nAmount: ${amount || ''}\n\nIf you need help, reply to this email.\n\n- Digitory`
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f1c20;">
        <h2 style="margin: 0 0 12px;">Hi ${safeName},</h2>
        <p style="margin: 0 0 12px;">Thanks for your purchase! Your download is ready.</p>
        <p style="margin: 0 0 12px;"><strong>Product:</strong> ${safeTitle}</p>
        <p style="margin: 0 0 12px;"><strong>Amount:</strong> ${amount || ''}</p>
        <p style="margin: 16px 0;">
          <a href="${downloadLink}" style="display: inline-block; padding: 12px 18px; background: #1bb3a8; color: #fff; text-decoration: none; border-radius: 999px;">
            Download your file
          </a>
        </p>
        <p style="margin: 16px 0;">If the button does not work, use this link:</p>
        <p style="margin: 0 0 12px;"><a href="${downloadLink}">${downloadLink}</a></p>
        <p style="margin: 24px 0 0;">- Digitory</p>
      </div>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject,
        text,
        html,
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      return new Response(
        JSON.stringify({ error: 'Email provider error.', detail }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({ ok: true, downloadLink }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Request failed.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
