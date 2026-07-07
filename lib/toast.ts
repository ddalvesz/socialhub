'use client'

export type ToastType = 'error' | 'success'
type Listener = (message: string, type: ToastType) => void

const listeners = new Set<Listener>()

export function showToast(message: string, type: ToastType = 'error') {
  listeners.forEach(fn => fn(message, type))
}

export function subscribeToast(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
