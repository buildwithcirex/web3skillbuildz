'use client'

import { useState } from 'react'
import type { Team } from '@/lib/team/types'
import { ExternalLink, Edit3, RotateCcw, Lock, Award, MessageSquare } from 'lucide-react'
import { revertSubmission } from '@/app/actions/project'

interface SubmissionPreviewProps {
  team: Team
  isLocked: boolean
  isScoresPublished: boolean
  onEdit: () => void
}

export default function SubmissionPreview({
  team,
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

  const hasScore = team.score !== null && team.score !== undefined

  return (
    // BUG-24: Rewrote to Neo-Brutalist design system
    <div className="bg-white rounded-none border-2 border-stone-900 shadow-[4px_4px_0px_0px_#1c1917] p-6 space-y-6 relative">
      {/* Corner decorative dots */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-stone-900" />
      <div className="absolute top-0 right-0 w-2 h-2 bg-stone-900" />
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-stone-900" />
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-stone-900" />

      {/* Header and status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold font-mono uppercase text-stone-900">Your Project Submission</h3>
          <p className="text-xs font-mono text-stone-600 mt-0.5">Submitted by {team.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono uppercase text-amber-800 bg-amber-100 px-3 py-1 rounded-none border-2 border-stone-900">
              <Lock className="w-3.5 h-3.5" />
              Submissions Locked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono uppercase text-green-700 bg-green-100 px-3 py-1 rounded-none border-2 border-stone-900">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-none" />
              Submitted
            </span>
          )}
        </div>
      </div>

      {/* Score and Judge Feedback (ONLY shown when scores are published by admin) */}
      {hasScore && isScoresPublished && (
        <div className="bg-amber-50 rounded-none border-2 border-stone-900 shadow-[4px_4px_0px_0px_#1c1917] p-5 space-y-3 relative">
          <div className="absolute top-0 left-0 w-2 h-2 bg-stone-900" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-stone-900" />
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-stone-900" />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-stone-900" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h4 className="text-sm font-bold font-mono uppercase text-stone-900">Evaluation Score</h4>
            </div>
            <div className="text-2xl font-black font-mono text-stone-900 bg-white px-3 py-1 rounded-none border-2 border-stone-900">
              {team.score} <span className="text-xs font-normal text-stone-600">/ 100</span>
            </div>
          </div>
          {team.feedback && (
            <div className="bg-white rounded-none p-3.5 border-2 border-stone-900 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold font-mono uppercase text-stone-900">
                <MessageSquare className="w-3.5 h-3.5 text-stone-700" />
                Organizer Feedback:
              </div>
              <p className="text-sm text-stone-700 italic">&ldquo;{team.feedback}&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {/* When scores are not published yet */}
      {!isScoresPublished && (
        <div className="bg-stone-100 border-2 border-stone-900 rounded-none p-3.5 flex items-center gap-2.5 text-xs text-stone-600">
          <Award className="w-4 h-4 text-stone-600 shrink-0" />
          <span className="font-mono">Evaluation in progress. Scores will be announced once finalized by the organizer.</span>
        </div>
      )}

      {/* Screenshot */}
      {team.screenshotUrl && (
        <div className="rounded-none overflow-hidden border-2 border-stone-900 bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={team.screenshotUrl}
            alt="Project Screenshot"
            className="w-full object-cover max-h-80"
          />
        </div>
      )}

      {/* Description */}
      <div>
        <p className="text-xs font-bold font-mono uppercase text-stone-600 tracking-wider mb-1">Description</p>
        <p className="text-sm text-stone-900 leading-relaxed whitespace-pre-wrap">{team.projectDescription}</p>
      </div>

      {/* Deploy Link */}
      <div>
        <p className="text-xs font-bold font-mono uppercase text-stone-600 tracking-wider mb-1">Live Project</p>
        {/* BUG-25: Changed fallback from '#' to '' and ensured target/_blank + rel are present */}
        <a
          href={team.deployLink || ''}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-stone-900 hover:text-stone-700 font-bold font-mono transition"
        >
          {team.deployLink}
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {error && (
        <p className="text-sm font-bold font-mono uppercase text-red-900 bg-red-100 border-2 border-red-900 px-4 py-3">
          {error}
        </p>
      )}

      {/* Participant Actions (Edit / Revert) */}
      <div className="pt-4 border-t-2 border-stone-900 flex flex-wrap items-center justify-between gap-3">
        {isLocked ? (
          <p className="text-xs text-amber-700 flex items-center gap-1.5 font-bold font-mono uppercase">
            <Lock className="w-3.5 h-3.5" />
            Submissions are locked by the organizer. Changes cannot be made.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRevert}
              disabled={reverting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none border-2 border-stone-900 text-red-700 bg-white hover:bg-red-50 text-xs font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px] disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {reverting ? 'Withdrawing…' : 'Withdraw Submission'}
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-none bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-bold font-mono uppercase transition border-2 border-stone-900 shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
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
