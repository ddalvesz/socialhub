'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ERROR_MESSAGES: Record<string, string> = {
  domain_not_allowed: 'Acesso restrito a e-mails @gocase.com.',
  auth_failed: 'Falha na autenticação. Tente novamente.',
  no_code: 'Link inválido. Tente novamente.',
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const errorMessage = errorParam ? (ERROR_MESSAGES[errorParam] ?? 'Erro desconhecido.') : null
  const supabase = createClient()

  async function handleGoogleLogin() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: 'gocase.com' },
      },
    })
  }

  return (
    <>
      {errorMessage && (
        <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-left">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {loading ? 'Redirecionando...' : 'Entrar com Google'}
      </button>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Calendário Gocase</h1>
          <p className="text-slate-500 text-sm mt-1">Redes Sociais</p>
        </div>

        <Suspense fallback={<div className="h-12" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-5 text-xs text-slate-400">
          Apenas contas <span className="font-semibold text-slate-500">@gocase.com</span> têm acesso.
        </p>
      </div>
    </div>
  )
}
