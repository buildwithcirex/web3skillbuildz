import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  // Default destination — will be updated after we know the user's role
  const redirectTo = new URL('/', request.url)
  const response = NextResponse.redirect(redirectTo)

  // Create the Supabase client reading from request cookies and writing
  // directly onto the response object — this is the only way cookies survive
  // a redirect on Vercel / production serverless environments.
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

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'magiclink' | 'email',
    })
    if (error) {
      console.error('[auth/callback] verifyOtp error:', error.message)
      response.headers.set('Location', `/?error=${encodeURIComponent(error.message)}`)
      return response
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
      response.headers.set('Location', `/?error=${encodeURIComponent(error.message)}`)
      return response
    }
  } else {
    // No auth params at all — send back to login
    return response
  }

  // Auth succeeded — determine where to send the user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return response
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const destination = profile?.role === 'admin' ? '/admin' : '/dashboard'
  response.headers.set('Location', new URL(destination, request.url).toString())
  return response
}
