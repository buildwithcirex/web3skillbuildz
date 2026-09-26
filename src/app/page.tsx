import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthTabs from './_components/AuthTabs'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') redirect('/admin')
    else redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header - Neo-brutalist styling */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-6 bg-amber-400 border-2 border-stone-900 shadow-[4px_4px_0px_0px_#1c1917] rotate-[-2deg]">
            <svg className="w-8 h-8 text-stone-900" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-mono tracking-tighter uppercase text-stone-900">
            WEB3SKILLBUILDZ
          </h1>
          <p className="text-stone-600 mt-2 font-medium">Build. Submit. Compete.</p>
        </div>

        {/* Auth Card - Sharp corners, thick borders, hard shadow */}
        <div className="bg-white border-2 border-stone-900 shadow-[8px_8px_0px_0px_#1c1917] p-8">
          <AuthTabs />
        </div>

        <div className="mt-8 text-center font-mono text-xs text-stone-500 font-bold uppercase tracking-widest">
          SYS_AUTH :: SECURE
        </div>
      </div>
    </main>
  )
}
