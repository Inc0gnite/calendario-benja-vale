'use client'

import { useState, useTransition } from 'react'
import { deleteEvent } from '@/lib/actions'

type Props = {
  eventId: string
  date: string
}

export function DeleteButton({ eventId, date }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    const formData = new FormData()
    formData.set('id', eventId)
    formData.set('date', date)
    startTransition(() => {
      void deleteEvent(formData)
    })
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full py-2.5 rounded-xl text-sm font-medium border transition-opacity hover:opacity-80"
        style={{ borderColor: '#F0959566', color: '#F09595' }}
      >
        Eliminar evento
      </button>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #F0959544' }}>
      <div className="px-4 py-3 text-center" style={{ backgroundColor: '#F0959511' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          ¿Eliminar este evento?
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Esta acción no se puede deshacer
        </p>
      </div>
      <div className="flex" style={{ borderTop: '1px solid #F0959533' }}>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="flex-1 py-3 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)', borderRight: '1px solid #F0959533' }}
        >
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="flex-1 py-3 text-sm font-semibold transition-opacity"
          style={{ color: '#F09595', opacity: isPending ? 0.5 : 1 }}
        >
          {isPending ? 'Eliminando...' : 'Sí, eliminar'}
        </button>
      </div>
    </div>
  )
}
