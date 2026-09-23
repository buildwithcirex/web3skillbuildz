'use client'

import { useState } from 'react'
import type { Profile } from '@/lib/types'
import { ExternalLink, Edit3, RotateCcw, Lock, Award, MessageSquare } from 'lucide-react'
import { revertSubmission } from '@/app/actions/project'

interface SubmissionPreviewProps {
  profile: Profile
  isLocked: boolean
  isScoresPublished: boolean
  onEdit: () => void
}

export default function SubmissionPreview({
  profile,
  isLocked,
  isScoresPublished,
  onEdit,
}: SubmissionPreviewProps) {
  const [reverting, setReverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRevert = async () => {
    if (!confirm('Are you sure you want to withdraw your submission? This will clear your current project data so you can submit again.')) {
      return
    }

    setReverting(true)
    setError(null)
    const result = await revertSubmission()
    setReverting(false)
    if (result?.error) {
      setError(result.error)
    }
  }

  const hasScore = profile.score !== null && profile.score !== undefined

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      {/* Header and status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your Project Submission</h3>
          <p className="text-xs text-gray-500 mt-0.5">Submitted on {new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              <Lock className="w-3.5 h-3.5" />
              Submissions Locked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Submitted
            </span>
          )}
        </div>
      </div>

      {/* Score and Judge Feedback (ONLY shown when scores are published by admin) */}
      {hasScore && isScoresPublished && (
        <div className="bg-gradient-to-r from-amber-50 to-indigo-50 rounded-2xl border border-amber-200/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h4 className="text-sm font-bold text-gray-900">Evaluation Score</h4>
            </div>
            <div className="text-2xl font-black text-indigo-700 bg-white px-3 py-1 rounded-xl shadow-xs border border-indigo-100">
              {profile.score} <span className="text-xs font-normal text-gray-500">/ 100</span>
            </div>
          </div>
          {profile.feedback && (
            <div className="bg-white/80 rounded-xl p-3.5 border border-indigo-50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                Organizer Feedback:
              </div>
              <p className="text-sm text-gray-700 italic">&ldquo;{profile.feedback}&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {/* When scores are not published yet */}
      {!isScoresPublished && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-gray-600">
          <Award className="w-4 h-4 text-gray-400 shrink-0" />
          <span>Evaluation in progress. Scores will be announced once finalized by the organizer.</span>
        </div>
      )}

      {/* Screenshot */}
      {profile.screenshot_url && (
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.screenshot_url}
            alt="Project Screenshot"
            className="w-full object-cover max-h-80"
          />
        </div>
      )}

      {/* Description */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{profile.project_description}</p>
      </div>

      {/* Deploy Link */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Live Project</p>
        <a
          href={profile.deploy_link ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition"
        >
          {profile.deploy_link}
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Participant Actions (Edit / Revert) */}
      <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
        {isLocked ? (
          <p className="text-xs text-amber-700 flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5" />
            Submissions are locked by the organizer. Changes cannot be made.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRevert}
              disabled={reverting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {reverting ? 'Withdrawing…' : 'Withdraw Submission'}
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Submission
            </button>
          </>
        )}
      </div>
    </div>
  )
}
