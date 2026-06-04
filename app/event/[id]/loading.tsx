export default function EventDetailLoading() {
  return (
    <div className="min-h-screen animate-pulse" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div
        className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="h-3.5 w-14 rounded-full" style={{ backgroundColor: 'var(--surface-card)' }} />
        <div className="h-4 w-40 rounded-lg ml-2 flex-1" style={{ backgroundColor: 'var(--surface-card)' }} />
        <div className="h-7 w-14 rounded-xl" style={{ backgroundColor: 'var(--surface-card)' }} />
      </div>
      <div className="p-4 max-w-lg mx-auto flex flex-col gap-4">
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--surface-card)' }}
        >
          <div className="h-5 w-20 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
          {[140, 80, 100, 60].map((w, i) => (
            <div key={i} className="flex gap-2">
              <div className="h-3 w-24 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--border)' }} />
              <div className="h-3 rounded-full" style={{ width: w, backgroundColor: 'var(--border)' }} />
            </div>
          ))}
        </div>
        <div className="h-10 w-full rounded-xl" style={{ backgroundColor: 'var(--surface-card)' }} />
      </div>
    </div>
  )
}
