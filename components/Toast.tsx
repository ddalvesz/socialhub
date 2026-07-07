'use client'

import { useEffect, useState } from 'react'
import { subscribeToast, type ToastType } from '@/lib/toast'

interface ToastItem { id: number; message: string; type: ToastType }

export default function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => subscribeToast((message, type) => {
    const id = Date.now() + Math.random()
    setItems(arr => [...arr, { id, message, type }])
    setTimeout(() => setItems(arr => arr.filter(i => i.id !== id)), 6000)
  }), [])

  if (items.length === 0) return null

  return (
    <div className="toast-host">
      {items.map(item => (
        <div key={item.id} className={`toast toast-${item.type}`}>{item.message}</div>
      ))}
    </div>
  )
}
