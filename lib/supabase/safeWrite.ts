import { showToast } from '@/lib/toast'

interface WriteResult {
  error: { message: string } | null
}

/**
 * Awaits a Supabase write and, on failure, logs the error and shows a toast.
 * Returns whether the write succeeded — callers use this to roll back any
 * optimistic UI update they already applied.
 */
export async function safeWrite(
  promise: PromiseLike<WriteResult>,
  errorMessage = 'Falha ao salvar. Tente novamente.',
): Promise<boolean> {
  const { error } = await promise
  if (error) {
    console.error(error)
    showToast(errorMessage)
    return false
  }
  return true
}
