import Link from 'next/link'
import type { CalendarEvent } from '@/lib/events'

const URGENCY_COLOR: Record<string, string> = {
  alta: '#F09595',
  media: '#FAC775',
  baja: '#C0DD97',
}

const USER_COLOR: Record<string, string> = {
  Benja: '#5DCAA5',
  Vale: '#AFA9EC',
}

type Props = {
  event: CalendarEvent
}

export function EventCard({ event }: Props) {
  const firstParticipant = event.participants[0]?.name ?? 'Benja'
  const stripeColor = USER_COLOR[firstParticipant] ?? '#5DCAA5'
  const urgencyColor = URGENCY_COLOR[event.urgency] ?? '#FAC775'

  return (
    <Link
      href={`/event/${event.id}`}
      className="flex rounded-xl overflow-hidden transition-opacity hover:opacity-80 active:opacity-60"
      style={{ backgroundColor: 'var(--surface-card)' }}
    >
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: stripeColor }} />

      <div className="flex-1 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
            {event.title}
          </p>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
            style={{
              backgroundColor: urgencyColor + '33',
              color: urgencyColor,
            }}
          >
            {event.urgency}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          {event.event_time && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {event.event_time.slice(0, 5)}
            </span>
          )}
          <div className="flex gap-1">
            {event.participants.map((p) => (
              <span
                key={p.user_id}
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: (USER_COLOR[p.name] ?? '#5DCAA5') + '22',
                  color: USER_COLOR[p.name] ?? '#5DCAA5',
                }}
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
