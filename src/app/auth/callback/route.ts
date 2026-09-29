import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const response = NextResponse.redirect(new URL('/', request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'magiclink' | 'email',
    })
    if (error) {
      console.error('[auth/callback] verifyOtp error:', error.message)
      response.headers.set('Location', `/?error=${encodeURIComponent(error.message)}`)
      return response
    }
    user = data.user
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
      response.headers.set('Location', `/?error=${encodeURIComponent(error.message)}`)
      return response
    }
    user = data.user
  } else {
    return response
  }

  if (!user) {
    return response
  }

  // Use the service role to read the profile since the session cookie
  // was just set on the response (not yet on the request).
  // /dashboard already handles admin → /admin redirect, so this is a
  // belt-and-suspenders fast path.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const destination = profile?.role === 'admin' ? '/admin' : '/dashboard'
  response.headers.set('Location', new URL(destination, request.url).toString())
  return response
}

