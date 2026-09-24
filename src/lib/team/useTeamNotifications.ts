'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NotificationRow {
  id: string
  user_id: string
  type: string
  team_invitation_id: string | null
  message: string
  is_read: boolean
  created_at: string
}

function notifyBrowser(message: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const notification = new Notification('New Team Invitation', {
    body: message,
    tag: 'team-invitation',
  })
  notification.onclick = () => {
    window.focus()
    document.getElementById('team-requests')?.scrollIntoView({ behavior: 'smooth' })
    notification.close()
  }
}

// Subscribes to new team-invitation notifications for the current user via
// Supabase Realtime and fires a browser Notification for each one. De-dup
// relies on the UNIQUE(team_invitation_id) constraint on the notifications
// table (files/team_system_schema.sql) — one row, one INSERT event, one
// browser notification per invitation.
export function useTeamNotifications(userId: string) {
  // Whether to show the "enable notifications" prompt. We don't track the
  // live Notification.permission value in state (reading it only makes
  // sense as a one-off, gesture-triggered action) — we just hide the
  // prompt once the user has responded to it.
  const [promptDismissed, setPromptDismissed] = useState(false)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => {
          const row = payload.new as NotificationRow
          if (row.type === 'team_invitation') notifyBrowser(row.message)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    await Notification.requestPermission()
    setPromptDismissed(true)
  }

  const supported = typeof window !== 'undefined' && 'Notification' in window
  const showPrompt = supported && !promptDismissed && Notification.permission === 'default'

  return { showPrompt, requestPermission }
}
