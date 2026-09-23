'use client'

import { useState } from 'react'
import type { Profile } from '@/lib/types'
import SubmissionForm from './SubmissionForm'
import SubmissionPreview from './SubmissionPreview'

interface ParticipantSubmissionSectionProps {
  profile: Profile
  isLocked: boolean
  isScoresPublished: boolean
}

export default function ParticipantSubmissionSection({
  profile,
  isLocked,
  isScoresPublished,
}: ParticipantSubmissionSectionProps) {
  const [isEditing, setIsEditing] = useState(false)

  const hasSubmitted = !!(
    profile.project_description &&
    profile.deploy_link &&
    profile.screenshot_url
  )

  if (hasSubmitted && !isEditing) {
    return (
      <SubmissionPreview
        profile={profile}
        isLocked={isLocked}
        isScoresPublished={isScoresPublished}
        onEdit={() => setIsEditing(true)}
      />
    )
  }

  return (
    <SubmissionForm
      initialDescription={profile.project_description ?? ''}
      initialDeployLink={profile.deploy_link ?? ''}
      initialScreenshotUrl={profile.screenshot_url ?? ''}
      isLocked={isLocked}
      isEditing={hasSubmitted && isEditing}
      onCancelEdit={() => setIsEditing(false)}
    />
  )
}
