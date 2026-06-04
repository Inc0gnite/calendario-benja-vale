'use client'

import { useState, useTransition } from 'react'
import type { AuthUser } from '@/lib/auth'
import type { CalendarEvent } from '@/lib/events'

type Props = {
  user: AuthUser
  action: (formData: FormData) => Promise<void>
  defaultValues?: Partial<CalendarEvent> & { event_date?: string }
  mode: 'create' | 'edit'
}

const URGENCY_OPTIONS = [
  { value: 'alta', label: 'Alta', color: '#F09595' },
  { value: 'media', label: 'Media', color: '#FAC775' },
  { value: 'baja', label: 'Baja', color: '#C0DD97' },
] as const

const REMINDER_OPTIONS = [
  { value: 'friday_before', label: 'Viernes anterior' },
  { value: 'day_before', label: '1 día antes' },
  { value: 'week_before', label: '1 semana antes' },
  { value: 'month_before', label: '1 mes antes' },
  { value: 'custom', label: 'Fecha personalizada' },
]

const USER_COLOR: Record<string, string> = { Benja: '#5DCAA5', Vale: '#AFA9EC' }

export function EventForm({ user, action, defaultValues, mode }: Props) {
  const [urgency, setUrgency] = useState(defaultValues?.urgency ?? 'media')
  const [reminderType, setReminderType] = useState(defaultValues?.reminder_type ?? 'friday_before')
  const [participants, setParticipants] = useState<string[]>(
    defaultValues?.participants?.map((p) => p.name) ?? [user.name]
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleParticipant(name: string) {
    setParticipants((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (participants.length === 0) {
      setError('Seleccioná al menos un participante.')
      return
    }

    const form = e.currentTarget
    const eventDate = (form.elements.namedItem('event_date') as HTMLInputElement)?.value
    const customReminder = (form.elements.namedItem('custom_reminder') as HTMLInputElement)?.value

    if (reminderType === 'custom' && !customReminder) {
      setError('Elegí una fecha de recordatorio personalizada.')
      return
    }

    if (reminderType === 'custom' && customReminder && eventDate && customReminder >= eventDate) {
      setError('El recordatorio debe ser anterior a la fecha del evento.')
      return
    }

    const formData = new FormData(form)
    formData.set('urgency', urgency)
    formData.set('reminder_type', reminderType)
    formData.delete('participants')
    participants.forEach((p) => formData.append('participants', p))

    startTransition(() => {
      void action(formData)
    })
  }

  const inputStyle = {
    backgroundColor: 'var(--surface-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      {/* Título */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Título *
        </label>
        <input
          name="title"
          required
          defaultValue={defaultValues?.title ?? ''}
          placeholder="¿Qué es el evento?"
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
        />
      </div>

      {/* Fecha y Hora */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Fecha *
          </label>
          <input
            name="event_date"
            type="date"
            required
            defaultValue={defaultValues?.event_date ?? ''}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Hora
          </label>
          <input
            name="event_time"
            type="time"
            defaultValue={defaultValues?.event_time ?? ''}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Descripción
        </label>
        <textarea
          name="description"
          defaultValue={defaultValues?.description ?? ''}
          placeholder="Detalles opcionales..."
          rows={2}
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
          style={inputStyle}
        />
      </div>

      {/* Urgencia */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          Urgencia
        </label>
        <div className="grid grid-cols-3 gap-2">
          {URGENCY_OPTIONS.map(({ value, label, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => setUrgency(value)}
              className="py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: urgency === value ? color + '33' : 'transparent',
                color: urgency === value ? color : 'var(--text-muted)',
                border: `1px solid ${urgency === value ? color : 'var(--border)'}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Recordatorio */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Recordatorio
        </label>
        <select
          value={reminderType}
          onChange={(e) => setReminderType(e.target.value)}
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
        >
          {REMINDER_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {reminderType === 'custom' && (
          <input
            name="custom_reminder"
            type="date"
            defaultValue={
              defaultValues?.reminder_type === 'custom' ? (defaultValues?.reminder_date ?? '') : ''
            }
            className="mt-2 w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        )}
      </div>

      {/* Participantes */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          Participantes
        </label>
        <div className="flex gap-2">
          {['Benja', 'Vale'].map((name) => {
            const color = USER_COLOR[name]
            const isOn = participants.includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleParticipant(name)}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: isOn ? color + '22' : 'transparent',
                  color: isOn ? color : 'var(--text-muted)',
                  border: `1px solid ${isOn ? color : 'var(--border)'}`,
                }}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#F0959520', color: '#F09595' }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity mt-1"
        style={{
          backgroundColor: user.color,
          color: '#1A1A1A',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Guardando...' : mode === 'create' ? 'Crear evento' : 'Guardar cambios'}
      </button>
    </form>
  )
}
