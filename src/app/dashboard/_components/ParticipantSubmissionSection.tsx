'use client'

import { useState } from 'react'
import { Rocket, Lock } from 'lucide-react'
import type { Team } from '@/lib/team/types'
import { ensureSoloTeam } from '@/app/actions/team'
import SubmissionForm from './SubmissionForm'
import SubmissionPreview from './SubmissionPreview'

interface ParticipantSubmissionSectionProps {
  team: Team | null
  isSubmissionsLocked: boolean
  isScoresPublished: boolean
}

export default function ParticipantSubmissionSection({
  team,
  isSubmissionsLocked,
  isScoresPublished,
}: ParticipantSubmissionSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!team) {
    const handleGetStarted = async () => {
      setCreating(true)
      setError(null)
      const result = await ensureSoloTeam()
      setCreating(false)
      if (result?.error) setError(result.error)
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-3">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
          <Rocket className="w-6 h-6 text-indigo-700" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Ready to submit?</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          You haven&apos;t created or joined a team yet. Submitting sets you up with your own
          team — you can still invite others to join before you lock it.
        </p>
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 max-w-md mx-auto">
            {error}
          </p>
        )}
        <button
          onClick={handleGetStarted}
          disabled={creating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition shadow-sm"
        >
          {creating ? 'Setting up…' : 'Get Started'}
        </button>
      </div>
    )
  }

  if (!team.isLocked) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center space-y-3">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-amber-700" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Finalize your team to unlock submission</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Your team needs to be locked before you can submit a project. Locking freezes your
          team&apos;s membership, so make sure everyone&apos;s in before you do. Head back to your
          dashboard to lock your team.
        </p>
      </div>
    )
  }

  const hasSubmitted = !!(team.projectDescription && team.deployLink && team.screenshotUrl)

  if (hasSubmitted && !isEditing) {
    return (
      <SubmissionPreview
        team={team}
        isLocked={isSubmissionsLocked}
        isScoresPublished={isScoresPublished}
        onEdit={() => setIsEditing(true)}
      />
    )
  }

  return (
    <SubmissionForm
      initialDescription={team.projectDescription ?? ''}
      initialDeployLink={team.deployLink ?? ''}
      initialScreenshotUrl={team.screenshotUrl ?? ''}
      isLocked={isSubmissionsLocked}
      isEditing={hasSubmitted && isEditing}
      onCancelEdit={() => setIsEditing(false)}
    />
  )
}
