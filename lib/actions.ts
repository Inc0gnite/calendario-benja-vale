'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getUserFromToken } from './auth'
import { createAdminClient } from './supabase'
import { calculateReminderDate, type ReminderType } from './reminders'

async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('auth-token')?.value
}

async function getParticipantIds(names: string[]): Promise<string[]> {
  if (names.length === 0) return []
  const supabase = createAdminClient()
  const { data } = await supabase.from('users').select('id, name').in('name', names)
  return (data ?? []).map((u) => u.id)
}

function buildReminderDate(eventDate: string, reminderType: string, customReminder?: string): string {
  const eventDateObj = new Date(eventDate + 'T12:00:00')
  const customDate = customReminder ? new Date(customReminder + 'T12:00:00') : undefined
  return calculateReminderDate(eventDateObj, reminderType as ReminderType, customDate)
    .toISOString()
    .split('T')[0]
}

export async function createEvent(formData: FormData) {
  const token = await getAuthToken()
  const actor = await getUserFromToken(token)
  if (!actor) throw new Error('Unauthorized')

  const supabase = createAdminClient()

  const title = formData.get('title') as string
  const event_date = formData.get('event_date') as string
  const event_time = (formData.get('event_time') as string) || null
  const description = (formData.get('description') as string) || null
  const urgency = formData.get('urgency') as string
  const reminder_type = formData.get('reminder_type') as string
  const custom_reminder = formData.get('custom_reminder') as string | null
  const participantNames = formData.getAll('participants') as string[]

  const reminder_date = buildReminderDate(event_date, reminder_type, custom_reminder ?? undefined)

  const { data: event, error } = await supabase
    .from('events')
    .insert({ title, event_date, event_time, description, urgency, reminder_type, reminder_date, created_by: actor.id })
    .select('id')
    .single()

  if (error || !event) throw new Error('Failed to create event')

  const participantIds = await getParticipantIds(participantNames)
  if (participantIds.length > 0) {
    await supabase
      .from('event_participants')
      .insert(participantIds.map((user_id) => ({ event_id: event.id, user_id })))
  }

  revalidatePath('/calendar')
  redirect(`/calendar?date=${event_date}`)
}

export async function updateEvent(formData: FormData) {
  const token = await getAuthToken()
  const actor = await getUserFromToken(token)
  if (!actor) throw new Error('Unauthorized')

  const supabase = createAdminClient()

  const id = formData.get('id') as string
  const title = formData.get('title') as string
  const event_date = formData.get('event_date') as string
  const event_time = (formData.get('event_time') as string) || null
  const description = (formData.get('description') as string) || null
  const urgency = formData.get('urgency') as string
  const reminder_type = formData.get('reminder_type') as string
  const custom_reminder = formData.get('custom_reminder') as string | null
  const participantNames = formData.getAll('participants') as string[]

  const reminder_date = buildReminderDate(event_date, reminder_type, custom_reminder ?? undefined)

  await supabase
    .from('events')
    .update({ title, event_date, event_time, description, urgency, reminder_type, reminder_date, notified: false })
    .eq('id', id)

  await supabase.from('event_participants').delete().eq('event_id', id)
  const participantIds = await getParticipantIds(participantNames)
  if (participantIds.length > 0) {
    await supabase
      .from('event_participants')
      .insert(participantIds.map((user_id) => ({ event_id: id, user_id })))
  }

  revalidatePath('/calendar')
  revalidatePath(`/event/${id}`)
  redirect(`/calendar?date=${event_date}`)
}

export async function deleteEvent(formData: FormData) {
  const token = await getAuthToken()
  const actor = await getUserFromToken(token)
  if (!actor) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const id = formData.get('id') as string
  const date = formData.get('date') as string

  await supabase.from('events').delete().eq('id', id)

  revalidatePath('/calendar')
  redirect(`/calendar?date=${date}`)
}
