export default function CalendarLoading() {
  return (
    <div className="min-h-screen animate-pulse" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--surface-card)]" />
        <div className="h-4 w-24 rounded-lg bg-[var(--surface-card)]" />
        <div className="ml-auto h-6 w-16 rounded-full bg-[var(--surface-card)]" />
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* WeekStrip skeleton */}
        <div
          className="rounded-2xl mb-4 p-2 grid grid-cols-7 gap-1"
          style={{ backgroundColor: 'var(--surface-card)' }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 py-2.5">
              <div className="h-2.5 w-5 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
              <div className="h-4 w-5 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
              <div className="h-1 w-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
            </div>
          ))}
        </div>

        {/* Date label + button */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-3.5 w-40 rounded-full" style={{ backgroundColor: 'var(--surface-card)' }} />
          <div className="h-7 w-16 rounded-xl" style={{ backgroundColor: 'var(--surface-card)' }} />
        </div>

        {/* Event cards */}
        <div className="flex flex-col gap-2">
          {[72, 56, 72].map((h, i) => (
            <div
              key={i}
              className={`h-[${h}px] rounded-xl`}
              style={{ height: h, backgroundColor: 'var(--surface-card)' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
