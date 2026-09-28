'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [promptDismissed, setPromptDismissed] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default')
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission)
      // Only prompt if they haven't made a decision yet
      setShowPrompt(Notification.permission === 'default' && !promptDismissed)
    }
  }, [promptDismissed])

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
          notifyBrowser(row.message)
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, router])

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert("Your browser doesn't support push notifications.")
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)
      setPromptDismissed(true)

      if (permission === 'granted') {
        alert("Alerts Enabled! You will now be notified when someone invites you.")
      } else if (permission === 'denied') {
        alert("Alerts Blocked. If you change your mind, click the lock icon in your URL bar to allow notifications.")
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
    }
  }

  return { showPrompt, requestPermission, permissionStatus }
}
