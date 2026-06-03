import Link from 'next/link'
import { getUserFromToken } from '@/lib/auth'
import { getEventsForDate, getEventsForWeek } from '@/lib/events'
import { WeekStrip } from '@/components/WeekStrip'
import { EventCard } from '@/components/EventCard'

function getWeekDates(date: Date): string[] {
  const dow = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; date?: string }>
}) {
  const { token, date } = await searchParams
  const user = getUserFromToken(token)

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="rounded-2xl p-8 max-w-sm w-full text-center mx-4"
          style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Acceso no autorizado
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Usá el link personal que te compartimos para acceder al calendario.
          </p>
        </div>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const selectedDate = date ?? today
  const weekDates = getWeekDates(new Date(selectedDate + 'T12:00:00'))

  const [events, eventCounts] = await Promise.all([
    getEventsForDate(selectedDate),
    getEventsForWeek(weekDates[0], weekDates[6]),
  ])

  const displayDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header
        className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10"
        style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: user.color }}
        />
        <h1 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          Calendario
        </h1>
        <span
          className="ml-auto text-sm font-medium px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: user.color + '22', color: user.color }}
        >
          {user.name}
        </span>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <WeekStrip
          token={token!}
          selectedDate={selectedDate}
          weekDates={weekDates}
          eventCounts={eventCounts}
        />

        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-sm font-medium capitalize"
            style={{ color: 'var(--text-muted)' }}
          >
            {displayDate}
          </h2>
          <Link
            href={`/event/new?token=${token}&date=${selectedDate}`}
            className="text-sm font-medium px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80"
            style={{ backgroundColor: user.color + '22', color: user.color }}
          >
            + Nuevo
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {events.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Sin eventos este día
              </p>
            </div>
          ) : (
            events.map((event) => (
              <EventCard key={event.id} event={event} token={token!} />
            ))
          )}
        </div>
      </main>
    </div>
  )
}
