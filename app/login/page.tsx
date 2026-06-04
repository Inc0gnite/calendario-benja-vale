import { loginAction } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        className="rounded-2xl p-8 w-full max-w-sm"
        style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border)' }}
      >
        <div className="text-center mb-6">
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5DCAA5' }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#AFA9EC' }} />
          </div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Calendario
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Ingresá tu token de acceso
          </p>
        </div>

        <form action={loginAction} className="flex flex-col gap-4">
          <input
            name="token"
            type="text"
            required
            autoComplete="off"
            placeholder="Token..."
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: error ? '1px solid #F09595' : '1px solid var(--border)',
            }}
          />

          {error && (
            <p className="text-xs text-center" style={{ color: '#F09595' }}>
              Token inválido. Revisá el link que te compartieron.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#5DCAA5', color: '#1A1A1A' }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
