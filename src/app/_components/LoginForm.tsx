'use client'

import { signInWithMagicLink } from '@/app/actions/auth'
import { useActionState, useState, useEffect } from 'react'

export default function LoginForm() {
  const [state, action, pending] = useActionState(signInWithMagicLink, { error: '', success: false })
  const [countdown, setCountdown] = useState(0)

  // Start the 60s cooldown when a new successful link is dispatched
  useEffect(() => {
    if (state.success) {
      setCountdown(60)
    }
  }, [state.success, (state as any).timestamp])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  return (
    <form action={action} className="space-y-6">
      {state.success && (
        <div className="text-center py-5 border-2 border-stone-900 bg-amber-100 p-4 mb-4">
          <div className="w-10 h-10 bg-stone-900 flex items-center justify-center mx-auto mb-3 rounded-none">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-md font-bold font-mono text-stone-900 mb-1 uppercase">Link Dispatched</h3>
          <p className="text-stone-700 text-xs font-medium">
            A secure access token has been sent to your inbox.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-bold font-mono uppercase text-stone-900 mb-2">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          disabled={countdown > 0}
          autoComplete="email"
          placeholder="ce25.name@kccemsr.edu.in"
          className="w-full px-4 py-3 border-2 border-stone-900 rounded-none text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-0 focus:border-stone-900 bg-white transition-colors disabled:bg-stone-100 disabled:text-stone-500"
        />
      </div>

      {state?.error && (
        <div className="text-sm text-red-900 font-bold bg-red-100 border-2 border-red-900 rounded-none px-4 py-3">
          ERR: {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || countdown > 0}
        className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-900 text-sm font-bold font-mono uppercase rounded-none border-2 border-stone-900 border-b-4 transition-all active:border-b-2 active:translate-y-[2px]"
      >
        {pending ? 'Initializing...' : countdown > 0 ? `Resend available in ${countdown}s` : state.success ? 'Resend Link' : 'Authenticate'}
      </button>
    </form>
  )
}
