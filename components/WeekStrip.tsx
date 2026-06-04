'use client'

import { useRouter } from 'next/navigation'

type Props = {
  token: string
  selectedDate: string
  weekDates: string[]
  eventCounts: Record<string, number>
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function WeekStrip({ token, selectedDate, weekDates, eventCounts }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  function goToDay(date: string) {
    router.push(`/calendar?token=${token}&date=${date}`)
  }

  function shiftWeek(direction: 1 | -1) {
    const ref = new Date(weekDates[0] + 'T12:00:00')
    ref.setDate(ref.getDate() + direction * 7)
    router.push(`/calendar?token=${token}&date=${ref.toISOString().split('T')[0]}`)
  }

  const monthYear = new Date(weekDates[3] + 'T12:00:00').toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      className="rounded-2xl mb-4 overflow-hidden"
      style={{ backgroundColor: 'var(--surface-card)' }}
    >
      {/* Navegación de semana */}
      <div
        className="flex items-center justify-between px-3 pt-2.5 pb-1"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => shiftWeek(-1)}
          className="p-1.5 rounded-lg text-sm transition-opacity hover:opacity-60 active:opacity-40"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Semana anterior"
        >
          ←
        </button>
        <span
          className="text-xs font-semibold capitalize tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          {monthYear}
        </span>
        <button
          onClick={() => shiftWeek(1)}
          className="p-1.5 rounded-lg text-sm transition-opacity hover:opacity-60 active:opacity-40"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Semana siguiente"
        >
          →
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {weekDates.map((date) => {
          const dow = new Date(date + 'T12:00:00').getDay()
          const isSelected = date === selectedDate
          const isToday = date === today
          const count = eventCounts[date] ?? 0

          return (
            <button
              key={date}
              onClick={() => goToDay(date)}
              className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-colors"
              style={{
                backgroundColor: isSelected
                  ? '#5DCAA5'
                  : isToday
                  ? '#5DCAA511'
                  : 'transparent',
              }}
            >
              <span
                className="text-[10px] font-medium uppercase tracking-wide"
                style={{ color: isSelected ? '#1A1A1A99' : 'var(--text-muted)' }}
              >
                {DAYS[dow]}
              </span>
              <span
                className="text-sm font-semibold leading-none"
                style={{ color: isSelected ? '#1A1A1A' : 'var(--text-primary)' }}
              >
                {new Date(date + 'T12:00:00').getDate()}
              </span>
              <div className="flex gap-0.5 h-1 mt-0.5">
                {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: isSelected ? '#1A1A1A44' : '#5DCAA5' }}
                  />
                ))}
                {count === 0 && <div className="w-1 h-1" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
