'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ERROR_MESSAGES: Record<string, string> = {
  domain_not_allowed: 'Essa conta não é @gocase.com. Use sua conta corporativa.',
  auth_failed: 'Não conseguimos entrar agora. Tente novamente.',
  no_code: 'Link inválido. Tente novamente.',
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
        <div className="lp-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
          </svg>
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="g-btn"
      >
        {loading ? (
          <span className="g-glyph" aria-hidden="true" style={{ display: 'grid', placeItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2a10 10 0 1 0 10 10" style={{ opacity: 0.3 }}/>
              <path d="M12 2a10 10 0 0 1 10 10" style={{ animation: 'lp-spin .7s linear infinite', transformOrigin: '12px 12px' }}/>
            </svg>
          </span>
        ) : (
          <span className="g-glyph" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.86 2.69-6.63z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33z" fill="#FBBC05"/>
              <path d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .94 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          </span>
        )}
        {loading ? 'Entrando…' : 'Continuar com Google'}
        {!loading && (
          <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        )}
      </button>

      <p className="gate-note">
        <span className="lock" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2"/>
            <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
          </svg>
        </span>
        Apenas contas <span className="dom">@gocase.com</span>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="lp-stage tone-paper">

      {/* Top-left brand mark */}
      <div className="lp-corner">
        <span className="lp-mark" aria-label="SocialHub">
          <img className="logo-dark"  src="/socialhub-logo.png"       alt="" />
          <img className="logo-light" src="/socialhub-logo-light.png" alt="" />
        </span>
      </div>

      {/* Top-right help link */}
      <div className="lp-corner-right">
        Sem acesso? <a href="https://mail.google.com/chat/u/0/#chat/dm/eduarda.alves@gocase.com" target="_blank" rel="noopener">Falar com o time</a>
      </div>

      {/* ── Floating decorations (decorative, hidden on small viewports) ── */}

      {/* Post cards */}
      <div className="float-card pos-tl">
        <span className="platico plat-ig" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r=".9" fill="white"/>
          </svg>
        </span>
        <div className="ftxt">
          <b>Drop Vingadores</b>
          <span><i className="stat-dot"></i> hoje · 19:00</span>
        </div>
      </div>

      <div className="float-card pos-tr">
        <span className="platico plat-tt" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="white">
            <path d="M19.6 6.7a5 5 0 0 1-3.5-1.6 5 5 0 0 1-1.2-2.3h-3v12.4a2.7 2.7 0 1 1-1.9-2.6V9.4A5.6 5.6 0 1 0 14.9 15V9.3a8 8 0 0 0 4.7 1.5V7.6c-.1 0 0-.5 0-.9z"/>
          </svg>
        </span>
        <div className="ftxt">
          <b>Trend Coachella</b>
          <span><i className="stat-dot"></i> amanhã · 14:30</span>
        </div>
      </div>

      <div className="float-card lp-status-pub pos-bl">
        <span className="platico plat-yt" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="white">
            <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.9C18.2 5 12 5 12 5s-6.2 0-7.8.3A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.9C5.8 19 12 19 12 19s6.2 0 7.8-.3a2.6 2.6 0 0 0 1.8-1.9c.3-1.6.4-3.2.4-4.8s-.1-3.2-.4-4.8zM10 15V9l5.2 3-5.2 3z"/>
          </svg>
        </span>
        <div className="ftxt">
          <b>Bastidores · estúdio</b>
          <span><i className="stat-dot"></i> quinta · 11:00</span>
        </div>
      </div>

      <div className="float-card pos-br">
        <span className="platico plat-tw" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
            <path d="M18 3h3l-7 8 8 10h-6l-5-6-5 6H3l8-9L3 3h6l4 5 5-5z"/>
          </svg>
        </span>
        <div className="ftxt">
          <b>Thread bastidores</b>
          <span><i className="stat-dot"></i> sex · 16:00</span>
        </div>
      </div>

      {/* Day cards */}
      <div className="lp-day-card lp-day-today pos-ml">
        <div className="lp-dow">QUI</div>
        <div className="lp-dn">15</div>
        <div className="lp-dots">
          <i style={{ background: '#E1306C' }}></i>
          <i style={{ background: 'oklch(0.36 0.08 200)' }}></i>
          <i style={{ background: 'oklch(0.45 0.16 22)' }}></i>
        </div>
      </div>

      <div className="lp-day-card pos-mr">
        <div className="lp-dow">SEG</div>
        <div className="lp-dn">19</div>
        <div className="lp-dots">
          <i style={{ background: 'oklch(0.36 0.08 200)' }}></i>
          <i style={{ background: '#E1306C' }}></i>
        </div>
      </div>

      {/* Pill floats */}
      <div className="lp-pill-float pos-pill-tr">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
          <path d="M12 2l1.6 4.6L18 8l-4.4 1.4L12 14l-1.6-4.6L6 8l4.4-1.4L12 2zm6 10l.8 2.4L21 15l-2.2.6L18 18l-.8-2.4L15 15l2.2-.6L18 12zM5 14l.7 2L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-1L5 14z"/>
        </svg>
        +12 posts agendados
      </div>

      <div className="lp-pill-float pos-pill-bl">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
          <path d="M12 2l1.6 4.6L18 8l-4.4 1.4L12 14l-1.6-4.6L6 8l4.4-1.4L12 2zm6 10l.8 2.4L21 15l-2.2.6L18 18l-.8-2.4L15 15l2.2-.6L18 12zM5 14l.7 2L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-1L5 14z"/>
        </svg>
        3 campanhas ativas
      </div>

      {/* ── Central login card ── */}
      <main className="lp-card">
        <div className="lp-seal" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2.5"/>
            <path d="M3 10h18M8 3v4M16 3v4"/>
          </svg>
        </div>

        <h1 className="lp-brand" aria-label="SocialHub">
          <img className="logo-dark"  src="/socialhub-logo.png"       alt="" />
          <img className="logo-light" src="/socialhub-logo-light.png" alt="" />
        </h1>

        <p className="lp-sub">Hub de planejamento de Social Medias · Gocase</p>

        <Suspense fallback={<div style={{ height: 52 }} />}>
          <LoginForm />
        </Suspense>
      </main>

      {/* Base footer */}
      <div className="lp-base-bar">
        <span className="lp-ver">Feito pelo time de Growth Intelligence · 2026</span>
        <div className="lp-links">
          <a href="/status">Status</a>
        </div>
      </div>

    </div>
  )
}
