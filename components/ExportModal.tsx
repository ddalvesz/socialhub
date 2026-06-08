'use client'

import { useState } from 'react'
import { Icon, PlatformIcon } from './Icons'
import { PLATFORMS, todayISO, parseISO, toISO, pad } from '@/lib/types'

interface Props {
  onClose: () => void
}

type Preset = 'week' | 'month' | 'last30' | 'custom'

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v13M7 12l5 5 5-5"/><path d="M4 19h16"/>
  </svg>
)

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 8v1"/><path d="M12 12v4"/>
  </svg>
)

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)

function getWeekRange() {
  const today = parseISO(todayISO())
  const dow = today.getDay()
  const mon = new Date(today); mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  return {
    from: toISO(mon.getFullYear(), mon.getMonth(), mon.getDate()),
    to:   toISO(sun.getFullYear(), sun.getMonth(), sun.getDate()),
  }
}

function getMonthRange() {
  const today = parseISO(todayISO())
  const y = today.getFullYear(), m = today.getMonth()
  return {
    from: toISO(y, m, 1),
    to:   toISO(y, m, new Date(y, m + 1, 0).getDate()),
  }
}

function getLast30Range() {
  const today = parseISO(todayISO())
  const from  = new Date(today); from.setDate(today.getDate() - 29)
  return {
    from: toISO(from.getFullYear(), from.getMonth(), from.getDate()),
    to:   todayISO(),
  }
}

const STATUS_OPTIONS = [
  { id: 'entregue', label: 'Entregue',    dot: 'oklch(0.55 0.14 165)'  },
  { id: 'sched',    label: 'Agendado',    dot: 'oklch(0.52 0.14 220)'  },
  { id: 'prod',     label: 'Em produção', dot: 'oklch(0.55 0 0)'        },
]

const PLATFORM_OPTIONS = [
  { id: 'all',     label: 'Todas',     icon: <ArrowIcon />,                                 color: null       },
  { id: 'ig',      label: 'Instagram', icon: <PlatformIcon platform="ig" size={13} />,       color: '#E1306C'  },
  { id: 'tiktok',  label: 'TikTok',    icon: <PlatformIcon platform="tiktok" size={13} />,   color: '#111111'  },
  { id: 'twitter', label: 'Twitter',   icon: <PlatformIcon platform="twitter" size={13} />,  color: '#111111'  },
  { id: 'youtube', label: 'YouTube',   icon: <PlatformIcon platform="youtube" size={13} />,  color: '#FF0000'  },
]

export default function ExportModal({ onClose }: Props) {
  const [preset,      setPreset]      = useState<Preset>('month')
  const [platforms,   setPlatforms]   = useState<string[]>(['all'])
  const [statuses,    setStatuses]    = useState<string[]>(['sched'])
  const [customFrom,  setCustomFrom]  = useState(todayISO())
  const [customTo,    setCustomTo]    = useState(todayISO())
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  const range = preset === 'week'   ? getWeekRange()
              : preset === 'month'  ? getMonthRange()
              : preset === 'last30' ? getLast30Range()
              : { from: customFrom, to: customTo }

  const togglePlatform = (id: string) => {
    if (id === 'all') { setPlatforms(['all']); return }
    setPlatforms(prev => {
      const without = prev.filter(p => p !== 'all')
      if (without.includes(id)) {
        const next = without.filter(p => p !== id)
        return next.length === 0 ? ['all'] : next
      }
      return [...without, id]
    })
  }

  const toggleStatus = (id: string) => {
    setStatuses(prev =>
      prev.includes(id) && prev.length > 1
        ? prev.filter(s => s !== id)
        : prev.includes(id) ? prev : [...prev, id]
    )
  }

  const handleExport = async () => {
    setLoading(true); setError('')
    try {
      const activePlatforms = platforms.includes('all') ? [] : platforms
      const params = new URLSearchParams({
        from:     range.from,
        to:       range.to,
        statuses: statuses.join(','),
        ...(activePlatforms.length === 1 && { platform: activePlatforms[0] }),
      })
      const res = await fetch(`/api/export/metricool?${params}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Erro ao gerar CSV')
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `metricool-${range.from}-a-${range.to}.csv`
      a.click(); URL.revokeObjectURL(url)
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--line)' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #ff8c42 0%, #ff5a1f 100%)',
            display: 'grid', placeItems: 'center', color: 'white',
          }}>
            <DownloadIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Exportar para Metricool</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Gera um CSV para importar no Metricool</div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Período */}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase' }}>
              Período
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                { id: 'week',   label: 'Semana atual'   },
                { id: 'month',  label: 'Mês atual'      },
                { id: 'last30', label: 'Últimos 30 dias' },
                { id: 'custom', label: 'Personalizado'  },
              ] as { id: Preset; label: string }[]).map(p => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
                    background: preset === p.id ? 'linear-gradient(135deg, #ff8c42 0%, #ff5a1f 100%)' : 'var(--surface-2)',
                    color: preset === p.id ? 'white' : 'var(--ink-2)',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 5, textTransform: 'uppercase' }}>De</div>
                  <input className="field" type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 5, textTransform: 'uppercase' }}>Até</div>
                  <input className="field" type="date" value={customTo} min={customFrom} onChange={e => setCustomTo(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>
            )}
          </div>

          {/* Plataforma */}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase' }}>
              Plataforma
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PLATFORM_OPTIONS.map(p => {
                const active = platforms.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', border: 'none',
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: active && p.color ? p.color : active ? 'var(--ink)' : 'var(--surface-2)',
                      color: active ? 'white' : 'var(--ink-2)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {p.icon}
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status incluídos */}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase' }}>
              Status incluídos
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.map(s => {
                const active = statuses.includes(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleStatus(s.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', border: active ? `1.5px solid ${s.dot}` : '1.5px solid transparent',
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: active ? `${s.dot}22` : 'var(--surface-2)',
                      color: active ? 'var(--ink-1)' : 'var(--ink-3)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Info box */}
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '10px 14px', borderRadius: 10,
            background: 'oklch(0.98 0.02 75)', border: '1px solid oklch(0.9 0.06 75)',
          }}>
            <span style={{ color: '#ff8c42', flexShrink: 0, marginTop: 1 }}><InfoIcon /></span>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              O CSV gerado segue o formato de importação do <strong>Metricool</strong>.{' '}
              Cada linha representa um post com data, plataforma e legenda.
            </p>
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'oklch(0.97 0.02 25)', color: 'oklch(0.45 0.18 25)', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid var(--line)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            onClick={handleExport}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: loading ? 'var(--surface-2)' : 'linear-gradient(135deg, #ff8c42 0%, #ff5a1f 100%)',
              color: loading ? 'var(--ink-3)' : 'white',
              fontSize: 13.5, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Gerando...' : <><DownloadIcon /> Baixar CSV</>}
          </button>
        </div>

      </div>
    </div>
  )
}
