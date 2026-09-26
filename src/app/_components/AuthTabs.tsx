'use client'

import LoginForm from './LoginForm'

export default function AuthTabs() {
  return (
    <div>
      <div className="mb-8 border-b-2 border-stone-900 pb-4">
        <h2 className="text-xl font-bold font-mono text-stone-900 uppercase">System Login</h2>
        <p className="text-sm text-stone-600 mt-1">Authenticate via College ID</p>
      </div>
      <LoginForm />
    </div>
  )
}
