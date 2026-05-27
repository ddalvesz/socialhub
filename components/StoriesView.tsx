'use client'

import { useState, useMemo, useEffect } from 'react'
import { Icon } from './Icons'
import { GenericSelect } from './FormHelpers'
import { MONTHS, WEEKDAYS, buildMonthGrid, todayISO, parseISO, toISO, pad, fmtBR } from '@/lib/types'

/* ---- Constants ---- */
const STORY_CATEGORIES = [
  { id: 'asmr',        label: 'ASMR',        color: 'oklch(0.65 0.16 320)' },
  { id: 'trends',      label: 'Trends',      color: 'oklch(0.6 0.16 265)'  },
  { id: 'bastidores',  label: 'Bastidores',  color: 'oklch(0.65 0.14 60)'  },
  { id: 'produto',     label: 'Produto',     color: 'oklch(0.6 0.15 150)'  },
  { id: 'promocao',    label: 'Promoção',    color: 'oklch(0.6 0.18 25)'   },
  { id: 'branding',    label: 'Branding',    color: 'oklch(0.55 0.15 285)' },
  { id: 'engajamento', label: 'Engajamento', color: 'oklch(0.62 0.13 210)' },
]

const STORY_STATUSES = [
  { id: 'naoIniciado', label: 'Não iniciado', color: 'oklch(0.65 0.012 300)' },
  { id: 'andamento',   label: 'Em andamento', color: 'oklch(0.62 0.13 75)'   },
  { id: 'feito',       label: 'Feito',        color: 'oklch(0.6 0.13 265)'   },
  { id: 'postado',     label: 'Postado',      color: 'oklch(0.6 0.13 150)'   },
  { id: 'naoPostado',  label: 'Não postado',  color: 'oklch(0.6 0.05 25)'    },
]

const PRODUTOS_FOCO = [
  'Capa Care Verão', 'Carteira Care', 'Capa Liso Premium', 'Capa Floral Autoral',
  'Disney 100 — Princesas', 'Tampas Pastel', 'Coleção ASMR', 'Caneca Care',
  'Pop socket Care', 'Linha Geométrico', 'Capa Marvel', 'Linha Branding',
]

/* ---- Types ---- */
interface Story {
  id: number
  date: string
  time: string
  produto: string
  categoria: string
  status: string
  receita: number | null
  sessoes: number | null
  transacoes: number | null
  link: string
  linkCta: string
}

/* ---- Helpers ---- */
const storyCode = (iso: string, time: string) => {
  if (!iso || !time) return ''
  const [y, m, d] = iso.split('-')
  const [hh] = time.split(':')
  return `${y}${m}${d}${hh}`
}
const storyCodePretty = (iso: string, time: string) => {
  if (!iso || !time) return '—'
  const d = parseISO(iso)
  const [hh] = time.split(':')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, às ${hh}h`
}
const fmtBRL = (n: number | null) =>
  n == null ? '—' : 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const fmtInt = (n: number | null) =>
  n == null ? '—' : n.toLocaleString('pt-BR')

/* ---- Mock data ---- */
function genMockStories(): Story[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const rows: [string, string, number][] = [
    ['Capa Care Verão',       'produto',     9],
    ['Coleção ASMR',          'asmr',       11],
    ['Carteira Care',         'produto',    14],
    ['Linha Branding',        'branding',   18],
    ['Capa Floral Autoral',   'produto',    10],
    ['Caneca Care',           'promocao',   16],
    ['Disney 100 — Princesas','produto',    12],
    ['Capa Liso Premium',     'engajamento',19],
    ['Coleção ASMR',          'asmr',       21],
    ['Tampas Pastel',         'bastidores', 13],
    ['Pop socket Care',       'trends',     17],
    ['Capa Marvel',           'produto',    15],
    ['Linha Geométrico',      'bastidores', 11],
    ['Capa Care Verão',       'trends',     14],
    ['Carteira Care',         'branding',   20],
    ['Linha Branding',        'engajamento', 8],
    ['Tampas Pastel',         'promocao',   16],
    ['Coleção ASMR',          'asmr',       10],
    ['Disney 100 — Princesas','promocao',   18],
    ['Capa Floral Autoral',   'engajamento',12],
    ['Capa Care Verão',       'produto',    21],
    ['Caneca Care',           'bastidores',  9],
    ['Pop socket Care',       'produto',    13],
    ['Linha Geométrico',      'trends',     17],
    ['Coleção ASMR',          'asmr',       15],
    ['Capa Marvel',           'trends',     19],
    ['Capa Liso Premium',     'produto',    11],
    ['Tampas Pastel',         'produto',    14],
    ['Linha Branding',        'branding',   16],
    ['Carteira Care',         'engajamento',18],
  ]

  const out: Story[] = []
  let id = 1
  rows.forEach((row, i) => {
    const [produto, categoria, baseHour] = row
    const dayOffset = (i * 2 + (i % 3)) % (daysInMonth + 4)
    const dayN = 1 + dayOffset
    let d: number, m = month, y = year
    if (dayN > daysInMonth) {
      d = dayN - daysInMonth; m = month + 1
      if (m > 11) { m = 0; y = year + 1 }
    } else { d = dayN }
    const dateISO = toISO(y, m, d)
    const min = (i * 13) % 60
    const time = `${pad(baseHour)}:${pad(min)}`

    const isPast = (y < year) || (y === year && m < month) || (y === year && m === month && d < today)
    const isToday = (y === year && m === month && d === today)
    let status: string
    if (isPast) {
      status = i % 6 === 0 ? 'naoPostado' : 'postado'
    } else if (isToday) {
      status = i % 2 === 0 ? 'feito' : 'andamento'
    } else {
      const cycle = i % 5
      status = cycle === 0 ? 'feito' : cycle === 1 ? 'andamento' : 'naoIniciado'
    }

    let receita: number | null = null, sessoes: number | null = null, transacoes: number | null = null
    if (status === 'postado') {
      const base = 800 + ((i * 173) % 2400)
      receita = base * (12 + (i % 7))
      sessoes = 2400 + ((i * 311) % 9000)
      transacoes = 12 + ((i * 7) % 95)
    }

    out.push({
      id: id++, date: dateISO, time, produto, categoria, status,
      receita, sessoes, transacoes,
      link: status === 'postado' ? `https://instagram.com/story/${id}` : '',
      linkCta: `https://gocase.com.br/${produto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}`,
    })
  })
  return out
}

/* ============================================================
   Sub-components
   ============================================================ */
function StoryStatusPill({ status }: { status: string }) {
  const st = STORY_STATUSES.find(s => s.id === status) || STORY_STATUSES[0]
  return (
    <span className="story-status-pill" style={{
      background: `color-mix(in oklab, ${st.color}, white 88%)`,
      color: `color-mix(in oklab, ${st.color}, black 25%)`,
      border: `1px solid color-mix(in oklab, ${st.color}, white 78%)`,
    }}>
      <span className="dot" style={{ background: st.color, width: 6, height: 6 }} />
      {st.label}
    </span>
  )
}

function StoryCategoryChip({ id }: { id: string }) {
  const c = STORY_CATEGORIES.find(x => x.id === id)
  if (!c) return null
  return (
    <span className="story-cat-chip" style={{
      background: `color-mix(in oklab, ${c.color}, white 90%)`,
      color: `color-mix(in oklab, ${c.color}, black 20%)`,
    }}>
      {c.label}
    </span>
  )
}

function StoryDot({ story, onClick }: { story: Story; onClick: (s: Story) => void }) {
  const cat = STORY_CATEGORIES.find(c => c.id === story.categoria)!
  const st = STORY_STATUSES.find(s => s.id === story.status)!
  return (
    <button
      className="story-chip"
      onClick={e => { e.stopPropagation(); onClick(story) }}
      title={`${story.time} · ${story.produto} · ${st.label}`}
      style={{
        background: `color-mix(in oklab, ${cat.color}, white 92%)`,
        borderLeft: `3px solid ${cat.color}`,
        opacity: story.status === 'naoPostado' ? 0.55 : 1,
      }}
    >
      <span className="sc-time">{story.time}</span>
      <span className="sc-title" style={{ textDecoration: story.status === 'naoPostado' ? 'line-through' : 'none' }}>
        {story.produto}
      </span>
      <span className="sc-status-dot" style={{ background: st.color }} title={st.label} />
    </button>
  )
}

function StoriesCalendarGrid({ year, month, stories, onStoryClick, onNewStory }: {
  year: number; month: number; stories: Story[]
  onStoryClick: (s: Story) => void
  onNewStory: (iso: string) => void
}) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
  const today = todayISO()

  const byDay = useMemo(() => {
    const map: Record<string, Story[]> = {}
    stories.forEach(s => { (map[s.date] = map[s.date] || []).push(s) })
    Object.values(map).forEach(arr => arr.sort((a, b) => a.time.localeCompare(b.time)))
    return map
  }, [stories])

  const maxPerCell = 3
  return (
    <div className="cal-grid">
      {WEEKDAYS.map(w => <div key={w} className="cal-head">{w}</div>)}
      {cells.map((c, i) => {
        const isToday = c.iso === today
        const day = byDay[c.iso] || []
        const visible = day.slice(0, maxPerCell)
        const more = day.length - visible.length
        return (
          <div key={i}
            className={`cal-cell ${c.other ? 'other' : ''} ${isToday ? 'today' : ''}`}
            onClick={() => !c.other && onNewStory(c.iso)}>
            <div className="cal-num-row">
              <span className="cal-num-box">{c.day}</span>
              {day.length > 0 && (
                <span className="story-day-count" title={`${day.length} story${day.length > 1 ? 's' : ''}`}>
                  {day.length}
                </span>
              )}
            </div>
            {visible.map(s => <StoryDot key={s.id} story={s} onClick={onStoryClick} />)}
            {more > 0 && <div className="cal-more" onClick={e => e.stopPropagation()}>+{more} mais</div>}
          </div>
        )
      })}
    </div>
  )
}

/* ---- Category/Status button row ---- */
function CatButtons({ selected, items, onSelect }: {
  selected: string
  items: { id: string; label: string; color: string }[]
  onSelect: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map(c => (
        <button key={c.id} type="button"
          className={`story-cat-btn ${selected === c.id ? 'active' : ''}`}
          onClick={() => onSelect(c.id)}
          style={selected === c.id ? {
            background: `color-mix(in oklab, ${c.color}, white 84%)`,
            color: `color-mix(in oklab, ${c.color}, black 25%)`,
            borderColor: `color-mix(in oklab, ${c.color}, white 70%)`,
          } : {}}>
          <span className="dot" style={{ background: c.color }} />
          {c.label}
        </button>
      ))}
    </div>
  )
}

/* ---- Expanded inline card (list mode) ---- */
function StoryExpandedCard({ draft, set, onSave, onCancel, onDelete }: {
  draft: Story
  set: (k: keyof Story, v: any) => void
  onSave: (s: Story) => void
  onCancel: () => void
  onDelete: (s: Story) => void
}) {
  const cat = STORY_CATEGORIES.find(c => c.id === draft.categoria)
  const isPostado = draft.status === 'postado'

  return (
    <div className="list-expansion stories-exp">
      <div className="stories-exp-head">
        <div className="story-modal-mark" style={{
          background: `color-mix(in oklab, ${cat?.color || 'var(--accent)'}, white 80%)`,
          color: cat?.color || 'var(--accent-deep)',
          width: 38, height: 38, borderRadius: 10, flex: '0 0 38px',
        }}>
          <Icon.stories />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase' }}>
            Editar story · #{storyCode(draft.date, draft.time) || '—'}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            {draft.produto || 'Sem produto'}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 1 }}>{storyCodePretty(draft.date, draft.time)}</div>
        </div>
      </div>

      <div className="stories-exp-grid">
        <div className="exp-cell">
          <label>Data</label>
          <input className="field" type="date" value={draft.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="exp-cell">
          <label>Hora</label>
          <input className="field" type="time" value={draft.time} onChange={e => set('time', e.target.value)} />
        </div>
        <div className="exp-cell" style={{ gridColumn: 'span 2' }}>
          <label>Produto foco</label>
          <GenericSelect value={draft.produto}
            options={PRODUTOS_FOCO.map(p => ({ id: p, label: p }))}
            onChange={v => set('produto', v)}
            placeholder="Selecionar produto..." width={300} />
        </div>

        <div className="exp-cell" style={{ gridColumn: '1 / -1' }}>
          <label>Categoria</label>
          <CatButtons selected={draft.categoria} items={STORY_CATEGORIES} onSelect={v => set('categoria', v)} />
        </div>

        <div className="exp-cell" style={{ gridColumn: '1 / -1' }}>
          <label>Status</label>
          <CatButtons selected={draft.status} items={STORY_STATUSES} onSelect={v => set('status', v)} />
        </div>

        <div className="exp-cell" style={{ gridColumn: 'span 2' }}>
          <label>Link do conteúdo</label>
          <input className="field" placeholder="https://instagram.com/story/..."
            value={draft.link || ''} onChange={e => set('link', e.target.value)} />
        </div>
        <div className="exp-cell" style={{ gridColumn: 'span 2' }}>
          <label>Link CTA</label>
          <input className="field" placeholder="https://gocase.com.br/..."
            value={draft.linkCta || ''} onChange={e => set('linkCta', e.target.value)} />
        </div>

        {isPostado && (
          <>
            <div className="exp-section-divider"><span>Métricas</span></div>
            <div className="exp-cell">
              <label>Receita do story (R$)</label>
              <input className="field" type="number" placeholder="0"
                value={draft.receita ?? ''}
                onChange={e => set('receita', e.target.value === '' ? null : Number(e.target.value))} />
            </div>
            <div className="exp-cell">
              <label>Sessões totais</label>
              <input className="field" type="number" placeholder="0"
                value={draft.sessoes ?? ''}
                onChange={e => set('sessoes', e.target.value === '' ? null : Number(e.target.value))} />
            </div>
            <div className="exp-cell">
              <label>Transações</label>
              <input className="field" type="number" placeholder="0"
                value={draft.transacoes ?? ''}
                onChange={e => set('transacoes', e.target.value === '' ? null : Number(e.target.value))} />
            </div>
          </>
        )}
      </div>

      <div className="stories-exp-actions">
        <button className="btn btn-ghost danger-ghost" onClick={() => onDelete(draft)}>
          <Icon.trash /> Excluir
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-accent" onClick={() => onSave(draft)}>Salvar alterações</button>
      </div>
    </div>
  )
}

/* ---- List with expandable rows ---- */
const LIST_GRID_COLS = '40px 110px 110px 72px minmax(180px, 1fr) 130px 115px 90px 80px 135px 86px 48px'
const LIST_HEADERS = ['', 'Código', 'Data', 'Hora', 'Produto foco', 'Categoria', 'Receita', 'Sessões', 'Trans.', 'Status', 'Links', '']

function StoriesList({ stories, onSave, onDelete }: {
  stories: Story[]
  onSave: (s: Story) => void
  onDelete: (s: Story) => void
}) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [draft, setDraft] = useState<Story | null>(null)

  const open = (s: Story) => { setExpanded(s.id); setDraft({ ...s }) }
  const close = () => { setExpanded(null); setDraft(null) }
  const set = (k: keyof Story, v: any) => setDraft(d => d ? { ...d, [k]: v } : d)

  if (stories.length === 0) {
    return (
      <div className="stories-empty">
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>Nenhum story</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>Crie um novo story ou ajuste os filtros.</div>
      </div>
    )
  }

  return (
    <div className="list stories-list">
      <div className="list-row list-head" style={{ gridTemplateColumns: LIST_GRID_COLS }}>
        {LIST_HEADERS.map((h, i) => <div key={i} className="cell">{h}</div>)}
      </div>
      {stories.map(s => {
        const isOpen = expanded === s.id
        const liveDraft = isOpen && draft ? draft : s
        return (
          <div key={s.id}>
            <div className={`list-row expandable ${isOpen ? 'expanded' : ''}`}
              style={{ gridTemplateColumns: LIST_GRID_COLS }}
              onClick={() => isOpen ? close() : open(s)}>
              <div className="cell" style={{ padding: '14px 0 14px 12px' }}>
                <span style={{
                  display: 'inline-grid', placeItems: 'center', width: 22, height: 22, borderRadius: 999,
                  color: 'var(--ink-3)', transition: 'transform .2s',
                  transform: isOpen ? 'rotate(0)' : 'rotate(-90deg)',
                }}>
                  <Icon.chevD />
                </span>
              </div>
              <div className="cell" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>
                {storyCode(s.date, s.time)}
              </div>
              <div className="cell" style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtBR(s.date)}
              </div>
              <div className="cell" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{s.time}</div>
              <div className="cell" style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.produto}
              </div>
              <div className="cell"><StoryCategoryChip id={s.categoria} /></div>
              <div className="cell" style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: s.receita == null ? 'var(--ink-4)' : 'var(--ink)' }}>
                {fmtBRL(s.receita)}
              </div>
              <div className="cell" style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: s.sessoes == null ? 'var(--ink-4)' : 'var(--ink-2)' }}>
                {fmtInt(s.sessoes)}
              </div>
              <div className="cell" style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: s.transacoes == null ? 'var(--ink-4)' : 'var(--ink-2)' }}>
                {fmtInt(s.transacoes)}
              </div>
              <div className="cell"><StoryStatusPill status={s.status} /></div>
              <div className="cell" style={{ display: 'flex', gap: 6 }}>
                {s.link && (
                  <a href={s.link} target="_blank" rel="noopener noreferrer"
                    className="story-link-btn" onClick={e => e.stopPropagation()} title="Link do conteúdo">
                    <Icon.link />
                  </a>
                )}
                {s.linkCta && (
                  <a href={s.linkCta} target="_blank" rel="noopener noreferrer"
                    className="story-link-btn cta" onClick={e => e.stopPropagation()} title="Link CTA">
                    <Icon.link />
                  </a>
                )}
              </div>
              <div className="cell" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="story-row-del" onClick={e => { e.stopPropagation(); onDelete(s) }} title="Excluir">
                  <Icon.trash />
                </button>
              </div>
            </div>
            {isOpen && draft && (
              <StoryExpandedCard
                draft={liveDraft}
                set={set}
                onSave={d => { onSave(d); close() }}
                onCancel={close}
                onDelete={d => { onDelete(d); close() }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ---- Story Modal (calendar mode) ---- */
function StoryModal({ story, isNew, onClose, onSave, onDelete }: {
  story: Story; isNew: boolean
  onClose: () => void
  onSave: (s: Story) => void
  onDelete: (s: Story) => void
}) {
  const [draft, setDraft] = useState<Story>(story)
  useEffect(() => { setDraft(story) }, [story.id])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const set = (k: keyof Story, v: any) => setDraft(d => ({ ...d, [k]: v }))
  const cat = STORY_CATEGORIES.find(c => c.id === draft.categoria)
  const isPostado = draft.status === 'postado'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="story-modal-mark" style={{
            background: `color-mix(in oklab, ${cat?.color || 'var(--accent)'}, white 80%)`,
            color: cat?.color || 'var(--accent-deep)',
          }}>
            <Icon.stories />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase' }}>
              {isNew ? 'Novo story' : 'Editar story'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                {draft.produto || 'Sem produto'}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)' }}>
                #{storyCode(draft.date, draft.time) || '—'}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{storyCodePretty(draft.date, draft.time)}</div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <label>Data</label>
            <input className="field" type="date" value={draft.date}
              onChange={e => set('date', e.target.value)} style={{ width: 200 }} />

            <label>Hora</label>
            <input className="field" type="time" value={draft.time}
              onChange={e => set('time', e.target.value)} style={{ width: 140 }} />

            <label>Produto foco</label>
            <GenericSelect value={draft.produto}
              options={PRODUTOS_FOCO.map(p => ({ id: p, label: p }))}
              onChange={v => set('produto', v)} placeholder="Selecionar produto..." width={300} />

            <label>Categoria</label>
            <CatButtons selected={draft.categoria} items={STORY_CATEGORIES} onSelect={v => set('categoria', v)} />

            <label>Status</label>
            <CatButtons selected={draft.status} items={STORY_STATUSES} onSelect={v => set('status', v)} />

            <label>Link do conteúdo</label>
            <input className="field" placeholder="https://instagram.com/story/..."
              value={draft.link || ''} onChange={e => set('link', e.target.value)} />

            <label>Link CTA</label>
            <input className="field" placeholder="https://gocase.com.br/..."
              value={draft.linkCta || ''} onChange={e => set('linkCta', e.target.value)} />

            {isPostado && (
              <>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--line)', margin: '6px 0 2px',
                  paddingTop: 14, fontSize: 11, fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase',
                  color: 'var(--ink-3)' }}>
                  Métricas
                </div>
                <label>Receita do story</label>
                <div className="field-inline">
                  <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>R$</span>
                  <input className="field" type="number" placeholder="0"
                    value={draft.receita ?? ''} onChange={e => set('receita', e.target.value === '' ? null : Number(e.target.value))}
                    style={{ width: 180 }} />
                </div>

                <label>Sessões totais</label>
                <input className="field" type="number" placeholder="0"
                  value={draft.sessoes ?? ''} onChange={e => set('sessoes', e.target.value === '' ? null : Number(e.target.value))}
                  style={{ width: 180 }} />

                <label>Transações</label>
                <input className="field" type="number" placeholder="0"
                  value={draft.transacoes ?? ''} onChange={e => set('transacoes', e.target.value === '' ? null : Number(e.target.value))}
                  style={{ width: 140 }} />
              </>
            )}
          </div>
        </div>

        <div className="modal-foot">
          {!isNew && (
            <button className="btn btn-ghost danger-ghost" onClick={() => { onDelete(draft); onClose() }}>
              <Icon.trash /> Excluir
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={() => { onSave(draft); onClose() }}>
            {isNew ? 'Criar story' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   StoriesAgenda — timeline list view
   ============================================================ */
function StoriesAgenda({ stories, today, onStoryClick }: {
  stories: Story[]; today: string; onStoryClick: (s: Story) => void
}) {
  const weekday = (iso: string) => {
    const d = parseISO(iso)
    return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()]
  }

  const sorted = [...stories].sort((a, b) => {
    const av = `${a.date} ${a.time}`; const bv = `${b.date} ${b.time}`
    return av < bv ? -1 : av > bv ? 1 : 0
  })

  const grouped: [string, Story[]][] = []
  for (const s of sorted) {
    const last = grouped[grouped.length - 1]
    if (last && last[0] === s.date) last[1].push(s)
    else grouped.push([s.date, [s]])
  }

  if (grouped.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--ink-3)' }}>
        Nenhum story neste mês.
      </div>
    )
  }

  return (
    <div className="pautas-view" style={{ paddingTop: 16 }}>
      {grouped.map(([date, dayStories]) => {
        const isToday = date === today
        const isPast = date < today
        return (
          <div key={date} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 2 }}>
            <div style={{
              width: 64, flexShrink: 0, paddingTop: 10, textAlign: 'right',
              fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.3,
              color: isToday ? 'var(--accent)' : isPast ? 'var(--ink-3)' : 'var(--ink-2)',
              fontWeight: isToday ? 700 : 500,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{date.slice(8)}</div>
              <div style={{ fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{weekday(date)}</div>
              {isToday && <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, fontWeight: 700 }}>hoje</div>}
            </div>
            <div style={{ flex: 1, borderLeft: `2px solid ${isToday ? 'var(--accent-soft)' : 'var(--border)'}`, paddingLeft: 16, paddingTop: 8, paddingBottom: 8 }}>
              {dayStories.map(s => {
                const cat = STORY_CATEGORIES.find(c => c.id === s.categoria)
                const st = STORY_STATUSES.find(x => x.id === s.status)
                return (
                  <div
                    key={s.id}
                    onClick={() => onStoryClick(s)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', marginBottom: 4, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-softer)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)', width: 40, flexShrink: 0 }}>{s.time}</div>
                    {cat && (
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 7px', borderRadius: 5, background: cat.color + '22', color: cat.color, flexShrink: 0 }}>
                        {cat.label}
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.produto}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>{storyCodePretty(s.date, s.time)}</div>
                    </div>
                    {s.receita != null && (
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{fmtBRL(s.receita)}</div>
                        <div>{fmtInt(s.sessoes)} sess.</div>
                      </div>
                    )}
                    {st && (
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6, background: st.color + '20', color: st.color, flexShrink: 0 }}>
                        {st.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ============================================================
   StoriesView — main export
   ============================================================ */
export default function StoriesView() {
  const today = todayISO()
  const todayD = parseISO(today)

  const [stories, setStories] = useState<Story[]>(() => genMockStories())
  const [mode, setMode] = useState<'calendar' | 'list' | 'agenda'>('calendar')
  const [year, setYear] = useState(todayD.getFullYear())
  const [month, setMonth] = useState(todayD.getMonth())

  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [active, setActive] = useState<Story | null>(null)
  const [isNew, setIsNew] = useState(false)

  const goPrev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const goNext = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }
  const goToday = () => { const t = parseISO(today); setYear(t.getFullYear()); setMonth(t.getMonth()) }

  const filtered = useMemo(() => {
    let arr = stories
    if (catFilter !== 'all')    arr = arr.filter(s => s.categoria === catFilter)
    if (statusFilter !== 'all') arr = arr.filter(s => s.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(s => s.produto.toLowerCase().includes(q) || storyCode(s.date, s.time).includes(q))
    }
    return arr
  }, [stories, catFilter, statusFilter, search])

  const monthFiltered = useMemo(() =>
    filtered.filter(s => {
      const d = parseISO(s.date)
      return d.getFullYear() === year && d.getMonth() === month
    }), [filtered, year, month])

  const sortedList = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = `${a.date} ${a.time}`
      const bv = `${b.date} ${b.time}`
      return av < bv ? -1 : av > bv ? 1 : 0
    })
  }, [filtered])

  const saveStory = (s: Story) => {
    setStories(arr => arr.some(x => x.id === s.id) ? arr.map(x => x.id === s.id ? s : x) : [...arr, s])
  }
  const deleteStory = (s: Story) => setStories(arr => arr.filter(x => x.id !== s.id))

  const openNew = (defaults: Partial<Story> = {}) => {
    const nextId = stories.reduce((m, s) => Math.max(m, s.id), 0) + 1
    setActive({
      id: nextId, date: defaults.date ?? today, time: '12:00',
      produto: PRODUTOS_FOCO[0], categoria: 'produto', status: 'naoIniciado',
      receita: null, sessoes: null, transacoes: null, link: '', linkCta: '',
    })
    setIsNew(true)
  }
  const openExisting = (s: Story) => { setActive(s); setIsNew(false) }

  const stats = useMemo(() => {
    const monthAll = stories.filter(s => {
      const d = parseISO(s.date)
      return d.getFullYear() === year && d.getMonth() === month
    })
    const postados = monthAll.filter(s => s.status === 'postado')
    return {
      total: monthAll.length,
      postados: postados.length,
      receita: postados.reduce((sum, s) => sum + (s.receita || 0), 0),
      sessoes: postados.reduce((sum, s) => sum + (s.sessoes || 0), 0),
      transacoes: postados.reduce((sum, s) => sum + (s.transacoes || 0), 0),
    }
  }, [stories, year, month])

  return (
    <>
      {/* sub-toolbar */}
      <div className="stories-toolbar">
        <div className="view-toggle">
          <button className={mode === 'calendar' ? 'active' : ''} onClick={() => setMode('calendar')}>
            <Icon.cal /> Calendário
          </button>
          <button className={mode === 'list' ? 'active' : ''} onClick={() => setMode('list')}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
            Lista
          </button>
          <button className={mode === 'agenda' ? 'active' : ''} onClick={() => setMode('agenda')}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Agenda
          </button>
        </div>

        {(mode === 'calendar' || mode === 'agenda') && (
          <>
            <div className="month-nav">
              <button onClick={goPrev}><Icon.chevL /></button>
              <div className="label">{MONTHS[month]} {year}</div>
              <button onClick={goNext}><Icon.chevR /></button>
            </div>
            <button className="today-btn" onClick={goToday}>Hoje</button>
          </>
        )}

        <div className="search-box" style={{ minWidth: 220 }}>
          <Icon.search />
          <input placeholder="Buscar story ou código..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ flex: 1 }} />

        <button className="btn btn-accent" onClick={() => openNew()}>
          <Icon.plus /> Novo story
        </button>
      </div>

      {/* stats strip */}
      {(mode === 'calendar' || mode === 'agenda') && (
        <div className="stories-stats">
          {[
            { label: 'No mês',      value: stats.total,                         sub: 'stories' },
            { label: 'Postados',    value: stats.postados,                      sub: `de ${stats.total}` },
            { label: 'Receita',     value: fmtBRL(stats.receita),               sub: 'soma postados', accent: true },
            { label: 'Sessões',     value: fmtInt(stats.sessoes),               sub: 'totais' },
            { label: 'Transações',  value: fmtInt(stats.transacoes),            sub: 'geradas' },
          ].map(c => (
            <div key={c.label} className={`ss-card ${c.accent ? 'accent' : ''}`}>
              <div className="ss-label">{c.label}</div>
              <div className="ss-value">{c.value}</div>
              <div className="ss-sub">{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* filter pills */}
      <div className="filter-bar" style={{ paddingTop: 0 }}>
        <button className={`platform-pill ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>
          Todas categorias
        </button>
        {STORY_CATEGORIES.map(c => (
          <button key={c.id} className={`platform-pill ${catFilter === c.id ? 'active' : ''}`} onClick={() => setCatFilter(c.id)}>
            <span className="dot" style={{ background: c.color }} />
            {c.label}
          </button>
        ))}

        <div style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 8px' }} />

        <button className={`tag-chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
          Todos status
        </button>
        {STORY_STATUSES.map(s => (
          <button key={s.id} className={`tag-chip ${statusFilter === s.id ? 'active' : ''}`} onClick={() => setStatusFilter(s.id)}>
            {s.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <span className="count-pill">
          {mode === 'calendar' || mode === 'agenda'
            ? `${monthFiltered.length} stories neste mês`
            : `${sortedList.length} stories no total`}
        </span>
      </div>

      {/* body */}
      {mode === 'calendar' && (
        <div className="cal-wrap">
          <StoriesCalendarGrid year={year} month={month} stories={filtered}
            onStoryClick={openExisting} onNewStory={d => openNew({ date: d })} />
        </div>
      )}
      {mode === 'list' && (
        <div className="list-wrap">
          <StoriesList stories={sortedList} onSave={saveStory} onDelete={deleteStory} />
        </div>
      )}
      {mode === 'agenda' && (
        <StoriesAgenda stories={monthFiltered} today={today} onStoryClick={openExisting} />
      )}

      {active && (
        <StoryModal story={active} isNew={isNew}
          onClose={() => { setActive(null); setIsNew(false) }}
          onSave={saveStory} onDelete={deleteStory} />
      )}
    </>
  )
}
