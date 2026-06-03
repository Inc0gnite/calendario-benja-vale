import { createAdminClient } from './supabase'

export type EventParticipant = {
  user_id: string
  name: string
}

export type CalendarEvent = {
  id: string
  title: string
  event_date: string
  event_time: string | null
  description: string | null
  urgency: 'alta' | 'media' | 'baja'
  reminder_type: string
  reminder_date: string | null
  notified: boolean
  created_by: string
  created_at: string
  participants: EventParticipant[]
}

export async function getEventsForDate(date: string): Promise<CalendarEvent[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('events')
    .select(`*, event_participants!event_id(user_id, users!user_id(id, name))`)
    .eq('event_date', date)
    .order('event_time', { ascending: true, nullsFirst: false })

  if (error || !data) return []

  return data.map((e: any) => ({
    ...e,
    participants: (e.event_participants ?? []).map((p: any) => ({
      user_id: p.user_id,
      name: p.users?.name ?? '',
    })),
  }))
}

export async function getEventsForWeek(
  start: string,
  end: string
): Promise<Record<string, number>> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('events')
    .select('event_date')
    .gte('event_date', start)
    .lte('event_date', end)

  const counts: Record<string, number> = {}
  for (const e of data ?? []) {
    counts[e.event_date] = (counts[e.event_date] ?? 0) + 1
  }
  return counts
}

export async function getEventById(id: string): Promise<CalendarEvent | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('events')
    .select(`*, event_participants!event_id(user_id, users!user_id(id, name))`)
    .eq('id', id)
    .single()

  if (!data) return null

  return {
    ...data,
    participants: (data.event_participants ?? []).map((p: any) => ({
      user_id: p.user_id,
      name: p.users?.name ?? '',
    })),
  }
}
