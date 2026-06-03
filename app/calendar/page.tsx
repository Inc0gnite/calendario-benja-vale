import { getUserFromToken } from '@/lib/auth'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const user = getUserFromToken(token)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div
          className="rounded-2xl p-8 max-w-sm w-full text-center shadow-sm mx-4"
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
          Calendario Benja & Vale
        </h1>
        <span
          className="ml-auto text-sm font-medium px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: user.color + '22', color: user.color }}
        >
          {user.name}
        </span>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {/* Phase 2: WeekStrip + EventList */}
        <div className="mt-16 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Fase 1 completada — bienvenido/a, {user.name} ✓
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            El calendario estará disponible en la Fase 2.
          </p>
        </div>
      </main>
    </div>
  )
}
