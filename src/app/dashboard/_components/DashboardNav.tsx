import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

interface DashboardNavProps {
  profileName: string
  activeTab?: 'home' | 'submission' | 'result'
}

const TABS: { key: NonNullable<DashboardNavProps['activeTab']>; label: string; href: string }[] = [
  { key: 'home', label: 'Home', href: '/dashboard' },
  { key: 'submission', label: 'Submission', href: '/dashboard/submit' },
  { key: 'result', label: 'Results', href: '/dashboard/results' },
]

export default function DashboardNav({ profileName, activeTab }: DashboardNavProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">SkillBuildz</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {TABS.map(tab => (
              <Link
                key={tab.key}
                href={tab.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full sm:w-48 md:w-64 pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 transition-colors"
            />
          </div>

          <span className="text-sm text-gray-500 hidden lg:block border-l border-gray-200 pl-4">
            Welcome, <span className="font-medium text-gray-900">{profileName}</span>
          </span>

          <form action={signOut}>
            <button
              type="submit"
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition px-3 py-1.5 rounded-lg hover:bg-red-50 whitespace-nowrap"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
