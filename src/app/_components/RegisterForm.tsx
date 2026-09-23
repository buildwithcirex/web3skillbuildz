'use client'

import { signUp } from '@/app/actions/auth'
import { useActionState } from 'react'

export default function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, { error: '', success: false })

  if (state.success) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Check your email!</h3>
        <p className="text-sm text-gray-500">
          We sent a confirmation link to your email. Click it to activate your account, then come back to Sign In.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-1.5">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="John Doe"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 transition"
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="block text-sm font-semibold text-gray-800 mb-1.5">
          Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 transition"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 mb-1.5">
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder="+91 98765 43210"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 transition"
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="block text-sm font-semibold text-gray-800 mb-1.5">
          Password
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Min 6 characters"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 transition"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-700 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition shadow-sm"
      >
        {pending ? 'Creating account…' : 'Create Account'}
      </button>

      <p className="text-center text-xs text-gray-500">
        Secure authentication powered by Supabase
      </p>
    </form>
  )
}
