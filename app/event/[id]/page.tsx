import Link from 'next/link'
import { getUserFromToken } from '@/lib/auth'
import { getEventById, type CalendarEvent } from '@/lib/events'
import { EventForm } from '@/components/EventForm'
import { DeleteButton } from '@/components/DeleteButton'
import { updateEvent } from '@/lib/actions'

const URGENCY_COLOR: Record<string, string> = {
  alta: '#F09595',
  media: '#FAC775',
  baja: '#C0DD97',
}

const USER_COLOR: Record<string, string> = {
  Benja: '#5DCAA5',
  Vale: '#AFA9EC',
}

function EventDetail({ event }: { event: CalendarEvent }) {
  const urgencyColor = URGENCY_COLOR[event.urgency] ?? '#FAC775'

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border)' }}
    >
      <span
        className="self-start text-xs font-medium px-2 py-0.5 rounded-full"
        style={{ backgroundColor: urgencyColor + '33', color: urgencyColor }}
      >
        Urgencia {event.urgency}
      </span>

      <div className="flex flex-col gap-2 text-sm">
        <Row label="Fecha">
          {new Date(event.event_date + 'T12:00:00').toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Row>

        {event.event_time && <Row label="Hora">{event.event_time.slice(0, 5)}</Row>}

        {event.reminder_date && (
          <Row label="Recordatorio">
            {new Date(event.reminder_date + 'T12:00:00').toLocaleDateString('es-AR', {
              day: 'numeric',
              month: 'long',
            })}
          </Row>
        )}

        {event.description && (
          <div>
            <span className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Descripción
            </span>
            <span style={{ color: 'var(--text-primary)' }}>{event.description}</span>
          </div>
        )}

        <Row label="Participantes">
          <div className="flex gap-1 flex-wrap">
            {event.participants.map((p) => (
              <span
                key={p.user_id}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: (USER_COLOR[p.name] ?? '#5DCAA5') + '22',
                  color: USER_COLOR[p.name] ?? '#5DCAA5',
                }}
              >
                {p.name}
              </span>
            ))}
          </div>
        </Row>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="flex-shrink-0 w-28 text-xs pt-0.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span style={{ color: 'var(--text-primary)' }}>{children}</span>
    </div>
  )
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string; edit?: string }>
}) {
  const [{ id }, { token, edit }] = await Promise.all([params, searchParams])
  const user = await getUserFromToken(token)

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Acceso no autorizado
        </p>
      </div>
    )
  }

  const event = await getEventById(id)
  if (!event) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Evento no encontrado
        </p>
      </div>
    )
  }

  const isEditing = edit === '1'
  const backHref = `/calendar?token=${token}&date=${event.event_date}`

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header
        className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10"
        style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}
      >
        <Link
          href={backHref}
          className="text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Volver
        </Link>
        <h1
          className="font-semibold text-base flex-1 truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {event.title}
        </h1>
        {!isEditing && (
          <Link
            href={`/event/${id}?token=${token}&edit=1`}
            className="text-sm px-3 py-1.5 rounded-xl flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ backgroundColor: user.color + '22', color: user.color }}
          >
            Editar
          </Link>
        )}
      </header>

      <main className="p-4 max-w-lg mx-auto flex flex-col gap-4">
        {isEditing ? (
          <EventForm
            token={token!}
            user={user}
            action={updateEvent}
            defaultValues={event}
            mode="edit"
          />
        ) : (
          <EventDetail event={event} />
        )}

        {!isEditing && (
          <DeleteButton eventId={event.id} token={token!} date={event.event_date} />
        )}
      </main>
    </div>
  )
}
