'use client'

import { useState } from 'react'
import { X, ExternalLink, Award, MessageSquare, Check } from 'lucide-react'
import type { AdminTeamSummary } from '@/lib/team/types'
import { scoreTeam } from '@/app/actions/project'

interface TeamScoreModalProps {
  team: AdminTeamSummary
  onClose: () => void
}

export default function TeamScoreModal({ team, onClose }: TeamScoreModalProps) {
  const [score, setScore] = useState<string>(
    team.score !== null && team.score !== undefined ? String(team.score) : ''
  )
  const [feedback, setFeedback] = useState<string>(team.feedback ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedSuccess(false)

    const numScore = score === '' ? null : Number(score)
    if (numScore !== null && (isNaN(numScore) || numScore < 0 || numScore > 100)) {
      setError('Score must be a number between 0 and 100.')
      setLoading(false)
      return
    }

    const result = await scoreTeam(team.id, numScore, feedback)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
    } else {
      setSavedSuccess(true)
      setTimeout(() => {
        onClose()
      }, 900)
    }
  }

  const hasSubmission = Boolean(
    team.projectDescription || team.deployLink || team.screenshotUrl
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Review & Score Team</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Team: <span className="font-semibold text-gray-800">{team.name}</span>
              {' · '}
              {team.members.map(m => m.name).join(', ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Submission Details */}
        {hasSubmission ? (
          <div className="space-y-4">
            {/* Screenshot */}
            {team.screenshotUrl ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Screenshot</p>
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 max-h-72 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={team.screenshotUrl}
                    alt="Project Screenshot"
                    className="w-full h-auto max-h-72 object-contain"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No screenshot provided.</p>
            )}

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Project Description</p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {team.projectDescription ?? 'No description provided.'}
              </div>
            </div>

            {/* Deploy Link */}
            {team.deployLink && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deploy Link</p>
                <a
                  href={team.deployLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {team.deployLink}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-amber-800">
              This team has not submitted a project yet.
            </p>
            <p className="text-xs text-amber-700 mt-1">
              You can still assign notes or score them if evaluated offline.
            </p>
          </div>
        )}

        {/* Scoring & Feedback Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="sm:col-span-1">
              <label htmlFor="modal_score" className="block text-sm font-semibold text-gray-800 mb-1.5">
                <Award className="inline w-4 h-4 mr-1 text-amber-600" />
                Score (0 - 100)
              </label>
              <input
                id="modal_score"
                type="number"
                min="0"
                max="100"
                step="1"
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder="e.g. 85"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="modal_feedback" className="block text-sm font-semibold text-gray-800 mb-1.5">
                <MessageSquare className="inline w-4 h-4 mr-1 text-indigo-600" />
                Feedback / Comments (Visible to team)
              </label>
              <textarea
                id="modal_feedback"
                rows={3}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Add feedback for the team..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {savedSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Score and feedback saved successfully!
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition shadow-xs"
            >
              {loading ? 'Saving…' : 'Save Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
