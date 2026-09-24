import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ requests: [] }, { status: 401 })
  }

  const { data: requests, error } = await supabase
    .from('team_requests')
    .select('id, sender_id')
    .eq('recipient_id', user.id)
    .eq('status', 'pending')

  if (error) {
    return NextResponse.json({ requests: [] }, { status: 500 })
  }

  const senderIds = Array.from(new Set((requests ?? []).map((request) => request.sender_id as string)))
  const { data: senders } = senderIds.length > 0
    ? await supabase
      .from('profiles')
      .select('id, name')
      .in('id', senderIds)
    : { data: [] as Array<{ id: string; name: string }> }

  const senderMap = new Map((senders ?? []).map((sender) => [sender.id as string, sender.name as string]))

  return NextResponse.json({
    requests: (requests ?? []).map((request) => ({
      id: request.id as string,
      senderName: senderMap.get(request.sender_id as string) ?? 'Unknown User',
    })),
  })
}

