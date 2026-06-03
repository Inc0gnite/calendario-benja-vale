import Link from 'next/link'
import { getUserFromToken } from '@/lib/auth'
import { EventForm } from '@/components/EventForm'
import { createEvent } from '@/lib/actions'

export default async function NewEventPage({
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
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Acceso no autorizado
        </p>
      </div>
    )
  }

  const backHref = `/calendar?token=${token}${date ? `&date=${date}` : ''}`

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <Link
          href={backHref}
          className="text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Volver
        </Link>
        <h1 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          Nuevo evento
        </h1>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        <EventForm
          token={token!}
          user={user}
          action={createEvent}
          defaultValues={{ event_date: date ?? '' }}
          mode="create"
        />
      </main>
    </div>
  )
}
