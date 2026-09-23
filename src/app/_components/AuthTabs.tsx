'use client'

import { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

export default function AuthTabs() {
  const [tab, setTab] = useState<'login' | 'register'>('login')

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('login')}
          className={`flex-1 py-3 text-sm font-semibold transition ${
            tab === 'login'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setTab('register')}
          className={`flex-1 py-3 text-sm font-semibold transition ${
            tab === 'register'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Register
        </button>
      </div>

      {/* Forms */}
      {tab === 'login' ? <LoginForm /> : <RegisterForm />}
    </div>
  )
}
