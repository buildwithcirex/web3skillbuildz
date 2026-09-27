'use client'

import { useState } from 'react'
import { Rocket, Lock, ArrowRight } from 'lucide-react'
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
      <div className="bg-white rounded-none border-2 border-stone-900 p-8 text-center space-y-4 relative">
        <div className="absolute top-0 left-0 w-2 h-2 bg-stone-900" />
        <div className="absolute top-0 right-0 w-2 h-2 bg-stone-900" />
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-stone-900" />
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-stone-900" />
        
        <div className="w-16 h-16 bg-amber-400 border-2 border-stone-900 flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#1c1917]">
          <Rocket className="w-8 h-8 text-stone-900" />
        </div>
        <h3 className="text-xl font-bold font-mono uppercase text-stone-900 tracking-tight">Ready to submit?</h3>
        <p className="text-sm font-medium text-stone-600 max-w-md mx-auto">
          You haven&apos;t created or joined a team yet. Submitting sets you up with your own
          team — you can still invite others to join before you lock it.
        </p>
        {error && (
          <p className="text-sm font-bold font-mono uppercase text-red-900 bg-red-100 border-2 border-red-900 px-4 py-3 max-w-md mx-auto">
            ERR: {error}
          </p>
        )}
        <button
          onClick={handleGetStarted}
          disabled={creating}
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-900 border-2 border-stone-900 text-sm font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
        >
          {creating ? 'Initializing...' : 'Get Started'}
          {!creating && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    )
  }

  if (!team.isLocked) {
    return (
      <div className="bg-amber-100 rounded-none border-2 border-stone-900 p-8 text-center space-y-4 relative">
        <div className="absolute top-0 left-0 w-2 h-2 bg-stone-900" />
        <div className="absolute top-0 right-0 w-2 h-2 bg-stone-900" />
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-stone-900" />
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-stone-900" />
        
        <div className="w-16 h-16 bg-white border-2 border-stone-900 flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#1c1917]">
          <Lock className="w-8 h-8 text-stone-900" />
        </div>
        <h3 className="text-xl font-bold font-mono uppercase text-stone-900 tracking-tight">Lock Required</h3>
        <p className="text-sm font-medium text-stone-700 max-w-md mx-auto">
          Your team needs to be locked before you can submit a project. Locking freezes your
          team&apos;s membership, so make sure everyone&apos;s in before you do. Head back to your
          dashboard home to lock your team.
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
