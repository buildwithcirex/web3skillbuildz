'use client'

import { useState, useMemo } from 'react'
import { Search, Edit, Trash2, ShieldCheck, X } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { updateParticipant, deleteParticipant, promoteToAdmin } from '@/app/actions/project'

export default function ParticipantsTable({ profiles }: { profiles: Profile[] }) {
  const [query, setQuery] = useState('')
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')

  const filtered = useMemo(() => {
    if (!query) return profiles
    const q = query.toLowerCase()
    return profiles.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phone ?? '').toLowerCase().includes(q)
    )
  }, [profiles, query])

  const openEdit = (p: Profile) => {
    setDeleteTarget(null)
    setEditTarget(p)
    setEditName(p.name)
    setEditEmail(p.email)
    setEditPhone(p.phone)
    setActionError(null)
  }

  const handleUpdate = async () => {
    if (!editTarget) return
    if (!editName.trim() || !editEmail.trim()) {
      setActionError('Name and email cannot be empty')
      return
    }
    setLoading(true)
    setActionError(null)
    const result = await updateParticipant(editTarget.id, {
      name: editName,
      email: editEmail,
      phone: editPhone,
    })
    setLoading(false)
    if (result?.error) {
      setActionError(result.error)
    } else {
      setEditTarget(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setLoading(true)
    setActionError(null)
    const result = await deleteParticipant(deleteTarget.id)
    setLoading(false)
    if (result?.error) {
      setActionError(result.error)
    } else {
      setDeleteTarget(null)
    }
  }

  const handlePromote = async (userId: string) => {
    if (!confirm('Promote this user to admin? This cannot be undone.')) return
    setActionError(null)
    setLoading(true)
    const result = await promoteToAdmin(userId)
    setLoading(false)
    if (result?.error) setActionError('Promote failed: ' + result.error)
  }

  return (
    <div className="bg-white border-4 border-stone-900 shadow-[8px_8px_0px_0px_#1c1917] overflow-hidden relative">
      {/* Search */}
      <div className="p-5 border-b-4 border-stone-900 bg-amber-200">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-900" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="SEARCH BY NAME, EMAIL, OR PHONE..."
            className="w-full pl-10 pr-10 py-3 text-sm font-bold font-mono text-stone-900 placeholder:text-stone-500 bg-stone-100 border-2 border-stone-900 rounded-none focus:outline-none focus:bg-white transition"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-900 hover:bg-stone-300 border-2 border-stone-900 bg-stone-200 p-0.5 transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {query && (
          <p className="text-xs font-bold font-mono text-stone-900 uppercase mt-2">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-stone-300 border-b-4 border-stone-900">
            <tr>
              <th className="text-left text-xs font-bold font-mono text-stone-900 uppercase tracking-widest px-5 py-3">Name</th>
              <th className="text-left text-xs font-bold font-mono text-stone-900 uppercase tracking-widest px-5 py-3 hidden md:table-cell">Email</th>
              <th className="text-left text-xs font-bold font-mono text-stone-900 uppercase tracking-widest px-5 py-3 hidden lg:table-cell">Phone</th>
              <th className="text-left text-xs font-bold font-mono text-stone-900 uppercase tracking-widest px-5 py-3">Role</th>
              <th className="text-right text-xs font-bold font-mono text-stone-900 uppercase tracking-widest px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-sm font-bold font-mono uppercase text-stone-500 py-12">
                  No participants found.
                </td>
              </tr>
            ) : (
              filtered.map(profile => (
                <tr key={profile.id} className="hover:bg-amber-100 transition border-b-2 border-stone-900 bg-white">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold font-mono uppercase text-stone-900">{profile.name}</p>
                    <p className="text-xs font-mono uppercase text-stone-500 md:hidden">{profile.email}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-sm font-mono font-semibold text-stone-700">{profile.email}</p>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <p className="text-sm font-mono font-semibold text-stone-700">{profile.phone}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold font-mono uppercase px-2 py-1 border-2 border-stone-900 ${
                      profile.role === 'admin'
                        ? 'text-stone-900 bg-indigo-400'
                        : 'text-stone-900 bg-stone-200'
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {profile.role === 'participant' && (
                        <button
                          onClick={() => handlePromote(profile.id)}
                          disabled={loading}
                          title="Promote to Admin"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-stone-900 text-stone-900 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-[10px] font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Promote</span>
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(profile)}
                        title="Edit Participant"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-stone-900 text-stone-900 bg-blue-400 hover:bg-blue-300 text-[10px] font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => { setEditTarget(null); setDeleteTarget(profile); setActionError(null) }}
                        title="Delete Participant"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-stone-900 text-stone-900 bg-red-400 hover:bg-red-300 text-[10px] font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-stone-900 shadow-[8px_8px_0px_0px_#1c1917] w-full max-w-md p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold font-mono uppercase text-stone-900">Edit Participant</h3>
              <button onClick={() => setEditTarget(null)} className="text-stone-500 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-mono text-stone-900 uppercase tracking-widest mb-1.5">Full Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-100 border-2 border-stone-900 rounded-none text-sm font-mono text-stone-900 focus:outline-none focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold font-mono text-stone-900 uppercase tracking-widest mb-1.5">Email</label>
                <input
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  type="email"
                  className="w-full px-4 py-2.5 bg-stone-100 border-2 border-stone-900 rounded-none text-sm font-mono text-stone-900 focus:outline-none focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold font-mono text-stone-900 uppercase tracking-widest mb-1.5">Phone</label>
                <input
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  type="tel"
                  className="w-full px-4 py-2.5 bg-stone-100 border-2 border-stone-900 rounded-none text-sm font-mono text-stone-900 focus:outline-none focus:bg-white transition"
                />
              </div>
              {actionError && (
                <p className="text-sm font-bold font-mono uppercase text-red-900 bg-red-100 border-2 border-red-900 px-4 py-3">{actionError}</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 py-2.5 border-2 border-stone-900 bg-stone-200 hover:bg-stone-300 text-stone-900 text-sm font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 py-2.5 border-2 border-stone-900 bg-indigo-400 hover:bg-indigo-300 disabled:opacity-50 text-stone-900 text-sm font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-stone-900 shadow-[8px_8px_0px_0px_#1c1917] w-full max-w-sm p-6 relative">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-12 h-12 bg-red-400 border-2 border-stone-900 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-stone-900" />
              </div>
              <h3 className="text-lg font-bold font-mono uppercase text-stone-900">Delete Participant?</h3>
              <p className="text-sm font-medium text-stone-600">
                This will permanently delete <span className="font-bold text-stone-900">{deleteTarget.name}</span> and all their data. This cannot be undone.
              </p>
            </div>
            {actionError && (
              <p className="text-sm font-bold font-mono uppercase text-red-900 bg-red-100 border-2 border-red-900 px-4 py-3 mb-4">{actionError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border-2 border-stone-900 bg-stone-200 hover:bg-stone-300 text-stone-900 text-sm font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2.5 border-2 border-stone-900 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-stone-900 text-sm font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

