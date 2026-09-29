import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * GET /auth/confirm?token_hash=...&type=magiclink
 *
 * Email scanners (like the college mail gateway) pre-fetch every link in an
 * email. If the link goes straight to Supabase's verify endpoint the OTP is
 * consumed before the user even clicks, producing "otp_expired".
 *
 * Instead the email link points here. The GET just returns a static HTML
 * page with a <form> button — scanners can't submit forms, so the OTP is
 * preserved. The user clicks the button → POST → OTP verified → redirect.
 */
export async function GET(request: NextRequest) {
  const token_hash = (request.nextUrl.searchParams.get('token_hash') ?? '').replace(/[^\w-]/g, '')
  const type = (request.nextUrl.searchParams.get('type') ?? 'magiclink').replace(/[^\w]/g, '')

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Authenticate — WEB3SKILLBUILDZ</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      background: #f5f5f4;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 2rem;
    }
    .card {
      background: #fff;
      border-top: 4px solid #1c1917;
      border-left: 4px solid #1c1917;
      border-bottom: 10px solid #1c1917;
      border-right: 10px solid #1c1917;
      padding: 2.5rem;
      max-width: 420px;
      width: 100%;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: #1c1917;
      margin-bottom: 0.5rem;
    }
    p {
      font-size: 0.8rem;
      color: #57534e;
      text-transform: uppercase;
      font-weight: 700;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    button {
      width: 100%;
      padding: 1rem;
      background: #fbbf24;
      border: 4px solid #1c1917;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 900;
      text-transform: uppercase;
      color: #1c1917;
      cursor: pointer;
      letter-spacing: 0.5px;
    }
    button:active { transform: translate(2px, 2px); }
    .label {
      font-size: 0.65rem;
      color: #a8a29e;
      text-transform: uppercase;
      font-weight: 700;
      margin-top: 1.5rem;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>WEB3SKILLBUILDZ</h1>
    <p>Identity verified. Click below to complete authentication and access your dashboard.</p>
    <form method="POST" action="/auth/confirm">
      <input type="hidden" name="token_hash" value="${token_hash}">
      <input type="hidden" name="type" value="${type}">
      <button type="submit">[ AUTHENTICATE SESSION ]</button>
    </form>
    <p class="label">SYS_AUTH :: SECURE · ONE-TIME ACCESS TOKEN</p>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

/**
 * POST /auth/confirm
 * Submitted by the user clicking the button — verifies the OTP and sets
 * session cookies directly on the redirect response (Vercel-safe pattern).
 */
export async function POST(request: NextRequest) {
  const form = await request.formData()
  const token_hash = String(form.get('token_hash') ?? '').replace(/[^\w-]/g, '')
  const type = String(form.get('type') ?? 'magiclink').replace(/[^\w]/g, '')

  const response = NextResponse.redirect(new URL('/', request.url))

  if (!token_hash) {
    response.headers.set('Location', '/?error=missing_token')
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // Write session cookies directly onto the response that gets returned
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as 'magiclink' | 'email',
  })

  if (error || !data.user) {
    console.error('[auth/confirm] verifyOtp error:', error?.message)
    response.headers.set('Location', `/?error=${encodeURIComponent(error?.message ?? 'auth_failed')}`)
    return response
  }

  // verifyOtp sets the session in the client's internal state, so the
  // profile query below is authenticated via the in-memory JWT.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  const destination = profile?.role === 'admin' ? '/admin' : '/dashboard'
  response.headers.set('Location', new URL(destination, request.url).toString())
  return response
}
