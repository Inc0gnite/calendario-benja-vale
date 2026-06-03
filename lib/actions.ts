'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getUserFromToken } from './auth'
import { createAdminClient } from './supabase'
import { calculateReminderDate, type ReminderType } from './reminders'

async function getUserIds(): Promise<Record<string, string>> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('users').select('id, name')
  const map: Record<string, string> = {}
  for (const u of data ?? []) map[u.name] = u.id
  return map
}

function buildReminderDate(eventDate: string, reminderType: string, customReminder?: string): string {
  const eventDateObj = new Date(eventDate + 'T12:00:00')
  const customDate = customReminder ? new Date(customReminder + 'T12:00:00') : undefined
  return calculateReminderDate(eventDateObj, reminderType as ReminderType, customDate)
    .toISOString()
    .split('T')[0]
}

export async function createEvent(formData: FormData) {
  const token = formData.get('token') as string
  const actor = getUserFromToken(token)
  if (!actor) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const userIds = await getUserIds()

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
    .insert({
      title,
      event_date,
      event_time,
      description,
      urgency,
      reminder_type,
      reminder_date,
      created_by: userIds[actor.name],
    })
    .select('id')
    .single()

  if (error || !event) throw new Error('Failed to create event')

  const participantIds = participantNames.map((n) => userIds[n]).filter(Boolean)
  if (participantIds.length > 0) {
    await supabase
      .from('event_participants')
      .insert(participantIds.map((user_id) => ({ event_id: event.id, user_id })))
  }

  revalidatePath('/calendar')
  redirect(`/calendar?token=${token}&date=${event_date}`)
}

export async function updateEvent(formData: FormData) {
  const token = formData.get('token') as string
  const actor = getUserFromToken(token)
  if (!actor) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const userIds = await getUserIds()

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
  const participantIds = participantNames.map((n) => userIds[n]).filter(Boolean)
  if (participantIds.length > 0) {
    await supabase
      .from('event_participants')
      .insert(participantIds.map((user_id) => ({ event_id: id, user_id })))
  }

  revalidatePath('/calendar')
  revalidatePath(`/event/${id}`)
  redirect(`/calendar?token=${token}&date=${event_date}`)
}

export async function deleteEvent(formData: FormData) {
  const token = formData.get('token') as string
  const actor = getUserFromToken(token)
  if (!actor) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const id = formData.get('id') as string
  const date = formData.get('date') as string

  await supabase.from('events').delete().eq('id', id)

  revalidatePath('/calendar')
  redirect(`/calendar?token=${token}&date=${date}`)
}
