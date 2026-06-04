export default function NewEventLoading() {
  return (
    <div className="min-h-screen animate-pulse" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="h-3.5 w-14 rounded-full" style={{ backgroundColor: 'var(--surface-card)' }} />
        <div className="h-4 w-28 rounded-lg ml-2" style={{ backgroundColor: 'var(--surface-card)' }} />
      </div>
      <div className="p-4 max-w-lg mx-auto flex flex-col gap-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <div className="h-2.5 w-20 rounded-full mb-1.5" style={{ backgroundColor: 'var(--surface-card)' }} />
            <div className="h-10 w-full rounded-xl" style={{ backgroundColor: 'var(--surface-card)' }} />
          </div>
        ))}
        <div className="h-12 w-full rounded-xl mt-1" style={{ backgroundColor: 'var(--surface-card)' }} />
      </div>
    </div>
  )
}
