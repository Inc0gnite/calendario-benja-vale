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

  return (
    <div
      className="grid grid-cols-7 gap-1 p-2 rounded-2xl mb-4"
      style={{ backgroundColor: 'var(--surface-card)' }}
    >
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
            {/* Dots = eventos del día */}
            <div className="flex gap-0.5 h-1 mt-0.5">
              {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: isSelected ? '#1A1A1A44' : '#5DCAA5',
                  }}
                />
              ))}
              {count === 0 && <div className="w-1 h-1" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}
