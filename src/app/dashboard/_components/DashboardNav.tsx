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
    <header className="bg-white border-b-4 border-stone-900">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-400 border-2 border-stone-900 flex items-center justify-center rotate-[-2deg]">
              <svg className="w-5 h-5 text-stone-900" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="font-bold font-mono text-stone-900 uppercase tracking-tight hidden sm:block">SkillBuildz</span>
          </Link>

          <nav className="flex items-center gap-2">
            {TABS.map(tab => (
              <Link
                key={tab.key}
                href={tab.href}
                className={`px-3 py-1.5 font-mono text-sm font-bold uppercase transition border-2 ${
                  activeTab === tab.key
                    ? 'border-stone-900 bg-stone-900 text-white shadow-[2px_2px_0px_0px_#fde047]'
                    : 'border-transparent text-stone-600 hover:border-stone-900 hover:text-stone-900 hover:shadow-[2px_2px_0px_0px_#1c1917]'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-sm font-mono text-stone-600 hidden lg:block border-l-2 border-stone-900 pl-4 uppercase">
            User :: <span className="font-bold text-stone-900">{profileName}</span>
          </span>

          <form action={signOut}>
            <button
              type="submit"
              className="text-sm font-mono font-bold uppercase text-stone-900 px-4 py-2 border-2 border-stone-900 hover:bg-red-500 hover:text-white transition shadow-[2px_2px_0px_0px_#1c1917] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]"
            >
              Terminate
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
