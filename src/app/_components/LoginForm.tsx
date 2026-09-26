'use client'

import { signInWithMagicLink } from '@/app/actions/auth'
import { useActionState } from 'react'

export default function LoginForm() {
  const [state, action, pending] = useActionState(signInWithMagicLink, { error: '', success: false })

  if (state.success) {
    return (
      <div className="text-center py-6 border-2 border-stone-900 bg-amber-100 p-6">
        <div className="w-12 h-12 bg-stone-900 flex items-center justify-center mx-auto mb-4 rounded-none">
          <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold font-mono text-stone-900 mb-2 uppercase">Link Dispatched</h3>
        <p className="text-stone-700 text-sm font-medium">
          A secure access token has been sent to your inbox. Click the link to authenticate.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-bold font-mono uppercase text-stone-900 mb-2">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ce25.name@kccemsr.edu.in"
          className="w-full px-4 py-3 border-2 border-stone-900 rounded-none text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-0 focus:border-stone-900 bg-white transition-colors"
        />
      </div>

      {state?.error && (
        <div className="text-sm text-red-900 font-bold bg-red-100 border-2 border-red-900 rounded-none px-4 py-3">
          ERR: {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-900 text-sm font-bold font-mono uppercase rounded-none border-2 border-stone-900 border-b-4 transition-all active:border-b-2 active:translate-y-[2px]"
      >
        {pending ? 'Initializing...' : 'Authenticate'}
      </button>
    </form>
  )
}
