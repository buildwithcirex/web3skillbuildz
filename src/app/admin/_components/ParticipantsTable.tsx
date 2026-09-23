'use client'

import { useState, useMemo, Fragment } from 'react'
import { Search, Edit, Trash2, ShieldCheck, ExternalLink, X, ChevronDown, ChevronUp, Award } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { updateParticipant, deleteParticipant, promoteToAdmin } from '@/app/actions/project'
import ReviewModal from './ReviewModal'

export default function ParticipantsTable({ profiles }: { profiles: Profile[] }) {
  const [query, setQuery] = useState('')
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [reviewTarget, setReviewTarget] = useState<Profile | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
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
        p.phone.toLowerCase().includes(q)
    )
  }, [profiles, query])

  const openEdit = (p: Profile) => {
    setEditTarget(p)
    setEditName(p.name)
    setEditEmail(p.email)
    setEditPhone(p.phone)
    setActionError(null)
  }

  const handleUpdate = async () => {
    if (!editTarget) return
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
    setLoading(true)
    const result = await promoteToAdmin(userId)
    setLoading(false)
    if (result?.error) alert('Error: ' + result.error)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-10 py-3 text-sm text-gray-900 placeholder:text-gray-500 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {query && (
          <p className="text-xs text-gray-600 mt-2 font-medium">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Email</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Phone</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Score</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Role</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-sm text-gray-400 py-12">
                  No participants found.
                </td>
              </tr>
            ) : (
              filtered.map(profile => (
                <Fragment key={profile.id}>
                  <tr className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedRow(expandedRow === profile.id ? null : profile.id)}
                          className="text-gray-400 hover:text-indigo-600 transition"
                        >
                          {expandedRow === profile.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                          <p className="text-xs text-gray-400 md:hidden">{profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-600">{profile.email}</p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-sm text-gray-600">{profile.phone}</p>
                    </td>
                    <td className="px-5 py-4">
                      {profile.project_description ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          ✓ Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {profile.score !== null && profile.score !== undefined ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                          <Award className="w-3 h-3 text-amber-500" />
                          {profile.score}/100
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        profile.role === 'admin'
                          ? 'text-indigo-700 bg-indigo-100'
                          : 'text-gray-600 bg-gray-100'
                      }`}>
                        {profile.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setReviewTarget(profile)}
                          title="Review & Score"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-semibold transition"
                        >
                          <Award className="w-3.5 h-3.5 text-purple-600" />
                          <span>Review</span>
                        </button>
                        {profile.role === 'participant' && (
                          <button
                            onClick={() => handlePromote(profile.id)}
                            disabled={loading}
                            title="Promote to Admin"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Promote</span>
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(profile)}
                          title="Edit Participant"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(profile); setActionError(null) }}
                          title="Delete Participant"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-semibold transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {expandedRow === profile.id && (
                    <tr key={`${profile.id}-expanded`} className="bg-indigo-50/30">
                      <td colSpan={7} className="px-8 py-4">
                        {profile.project_description ? (
                          <div className="flex flex-col sm:flex-row gap-6">
                            {profile.screenshot_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={profile.screenshot_url}
                                alt="Screenshot"
                                className="w-full sm:w-48 h-32 object-cover rounded-lg border border-gray-200"
                              />
                            )}
                            <div className="flex-1 space-y-2">
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</p>
                                <p className="text-sm text-gray-700 mt-0.5">{profile.project_description}</p>
                              </div>
                              {profile.deploy_link && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Deploy Link</p>
                                  <a
                                    href={profile.deploy_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline mt-0.5"
                                  >
                                    {profile.deploy_link} <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No project submitted yet.</p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Edit Participant</h3>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Full Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email</label>
                <input
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  type="email"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone</label>
                <input
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  type="tel"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
              {actionError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{actionError}</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Participant?</h3>
              <p className="text-sm text-gray-500">
                This will permanently delete <span className="font-medium text-gray-900">{deleteTarget.name}</span> and all their data. This cannot be undone.
              </p>
            </div>
            {actionError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{actionError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition"
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Score Modal */}
      {reviewTarget && (
        <ReviewModal
          profile={reviewTarget}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  )
}
