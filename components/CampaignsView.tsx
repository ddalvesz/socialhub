'use client'

import { useState, useEffect } from 'react'
import { Icon, PlatformIcon } from './Icons'
import { GenericSelect, PackToggle, FieldCheckbox } from './FormHelpers'
import { Post, MONTH_ABBR, fmtBR, PLATFORMS, Campaign, Collection, Linking, PACKAGE_INFO, todayISO, COLECAO_TIPOS, colProgress } from '@/lib/types'
import { CAMP_TIPOS, TEAM_NAMES } from '@/lib/data'
import { DateRangeFilter, DateRange } from './FormHelpers'

const tipoColors: Record<string, string> = {
  'Institucional':       'oklch(0.55 0.13 265)',
  'Coleção':             'oklch(0.55 0.13 25)',
  'Produto':             'oklch(0.5 0.12 150)',
  'Data Comemorativa':   'oklch(0.55 0.13 320)',
}

// ─── Linked Posts Drawer ─────────────────────────────────────
interface DrawerProps {
  campaign: Campaign
  posts: Post[]
  onClose: () => void
  onPostClick: (post: Post) => void
}

export function LinkedPostsDrawer({ campaign, posts, onClose, onPostClick }: DrawerProps) {
  const linked = [...posts.filter(p => p.campanha === campaign.slug)]
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="label">CAMPANHA</div>
            <div className="title">{campaign.nome}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <span className={`event-pack ${campaign.pack.toLowerCase()}`}>{campaign.pack}</span>
              <span style={{
                padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 500,
                background: `color-mix(in oklab, ${tipoColors[campaign.tipo] ?? '#999'}, white 88%)`,
                color: tipoColors[campaign.tipo] ?? '#999',
              }}>{campaign.tipo}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>· {linked.length} {linked.length === 1 ? 'post' : 'posts'}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="drawer-body">
          {linked.length === 0 ? (
            <div className="drawer-empty">
              <div style={{ fontSize: 18, color: 'var(--ink-2)', marginBottom: 6, fontWeight: 600 }}>
                Sem posts vinculados ainda
              </div>
              <div style={{ fontSize: 13 }}>
                Crie um post e selecione "{campaign.nome}" como campanha.
              </div>
            </div>
          ) : linked.map(p => {
            const plat = PLATFORMS.find(x => x.id === p.platform)!
            const d = new Date(p.date + 'T12:00:00')
            return (
              <div key={p.id} className="linked-post" onClick={() => onPostClick(p)}>
                <div className="lp-date">
                  {d.getDate()}
                  <span className="month">{MONTH_ABBR[d.getMonth()]}</span>
                </div>
                <div className="lp-main">
                  <div className="lp-title">{p.title}</div>
                  <div className="lp-meta">
                    <span>{p.time}</span>
                    <span>·</span>
                    <span>{p.type}</span>
                    <span>·</span>
                    <span>{p.owner}</span>
                  </div>
                </div>
                <span className="lp-platform" style={{ background: plat.color }}>
                  <PlatformIcon platform={p.platform} size={12} color="white" />
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─── Milestones ──────────────────────────────────────────────
function Milestones({ campaign, onChange }: { campaign: Campaign; onChange: (patch: Partial<Campaign>) => void }) {
  const items = [
    { key: 'brainstorm', label: 'Brainstorm', dateKey: 'brainstormDate' as const, doneKey: 'brainstormDone' as const },
    { key: 'aprovComercial', label: 'Aprov. Comercial', dateKey: 'aprovComercialDate' as const, doneKey: 'aprovComercialDone' as const },
    { key: 'shooting', label: 'Shooting', dateKey: 'shootingDate' as const, doneKey: 'shootingDone' as const }
  ]

  return (
    <div className="milestones-row" onClick={(e) => e.stopPropagation()}>
      {items.map((it) => {
        const done = !!campaign[it.doneKey]
        return (
          <div key={it.key} className={`milestone ${done ? 'done' : ''}`}>
            <span className="ms-check" onClick={() => onChange({ [it.doneKey]: !done })}>
              {done && <Icon.check />}
            </span>
            <div className="ms-body">
              <div className="ms-label">{it.label}</div>
              <div className="ms-date">
                <input type="date" value={campaign[it.dateKey] as string || ''}
                  onChange={(e) => onChange({ [it.dateKey]: e.target.value })} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Package Info Panel ──────────────────────────────────────
function PackageInfoPanel() {
  const [open, setOpen] = useState(false)
  return (
    <div className="pkg-panel-wrap">
      <button className={`pkg-toggle ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)} type="button">
        <span className="pkg-toggle-badge">PP · P · M · G</span>
        Pacotes de campanhas
        <Icon.chevD />
      </button>
      {open && (
        <div className="pkg-panel">
          <div className="pkg-panel-head">
            <span className="ttl">Pacotes de Campanhas</span>
            <span className="sub">Como diferenciar e dimensionar cada tipo</span>
          </div>
          <div className="pkg-grid">
            {PACKAGE_INFO.map(pkg => (
              <div key={pkg.id} className="pkg-col" data-pack={pkg.id}>
                <div className="pkg-col-head">
                  <span className="badge">{pkg.id}</span>
                  <span className="nm">{pkg.nome.replace(`${pkg.id} — `, '')}</span>
                </div>
                <div className="pkg-field">
                  <span className="lbl">Objetivo principal</span>
                  <span className="val">{pkg.objetivo}</span>
                </div>
                <div className="pkg-field">
                  <span className="lbl">Mensagem × produto</span>
                  <span className="val mensagem">{pkg.mensagem}</span>
                </div>
                <div className="pkg-field">
                  <span className="lbl">Complexidade</span>
                  <span className="pkg-complex">
                    <span className="fogo">{'🔥'.repeat(Math.max(1, pkg.fogo)) || '⚡'}</span>
                    {pkg.complexidade}
                  </span>
                </div>
                <div className="pkg-field">
                  <span className="lbl">Processos</span>
                  <ul className="pkg-list">{pkg.processos.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
                </div>
                <div className="pkg-field">
                  <span className="lbl">Principais entregáveis</span>
                  <ul className="pkg-list">{pkg.entregaveis.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Campaign Form Modal ──────────────────────────────────────
function CampaignFormModal({ initial, onClose, onSave }: { initial?: Campaign | null; onClose: () => void; onSave: (c: any) => void }) {
  const blank = {
    nome: '', slug: '', pack: 'P', dono: TEAM_NAMES[0], tipo: 'Coleção', mes: '',
    dataInsta: todayISO(), dataSite: '-', dataComercial: '-', dataFinal: '', previsao: todayISO(),
    launched: false, progresso: 0,
    brainstormDate: '', brainstormDone: false,
    aprovComercialDate: '', aprovComercialDone: false,
    shootingDate: '', shootingDone: false
  }
  const [draft, setDraft] = useState(() => ({ ...blank, ...(initial || {}) }))
  const set = (k: string, v: any) => setDraft(d => ({ ...d, [k]: v }))
  const isNew = !initial

  const handleSave = () => {
    if (!draft.nome.trim()) return
    const slug = draft.slug || draft.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)
    onSave({ ...draft, slug })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{
            width: 40, height: 40, borderRadius: 12, flex: '0 0 40px',
            background: 'var(--accent-gradient)', color: 'white', display: 'grid', placeItems: 'center'
          }}><Icon.campaign /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em' }}>
              {isNew ? 'NOVA CAMPANHA' : 'EDITAR CAMPANHA'}
            </div>
            <input className="modal-title" value={draft.nome} placeholder="Nome da campanha"
              onChange={e => set('nome', e.target.value)} autoFocus />
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <div className="modal-section-label">Informações gerais</div>

            <label>Pacote</label>
            <PackToggle value={draft.pack} onChange={v => set('pack', v)} />

            <label>Tipo</label>
            <GenericSelect value={draft.tipo} options={CAMP_TIPOS.map(t => ({ id: t, label: t }))}
              onChange={v => set('tipo', v)} width={240} />

            <label>Dono</label>
            <GenericSelect value={draft.dono} options={TEAM_NAMES.map(t => ({ id: t, label: t }))}
              onChange={v => set('dono', v)} width={200} />

            <label>Mês foco</label>
            <input className="field" value={draft.mes} placeholder="ex: Maio"
              onChange={e => set('mes', e.target.value)} style={{ maxWidth: 200 }} />

            <div className="modal-section-label">Cronograma</div>

            <label>Previsão de lançamento</label>
            <input className="field" type="date" value={draft.previsao}
              onChange={e => set('previsao', e.target.value)} style={{ maxWidth: 200 }} />

            <label>Data Instagram</label>
            <input className="field" type="date" value={draft.dataInsta}
              onChange={e => set('dataInsta', e.target.value)} style={{ maxWidth: 200 }} />

            <label>Data site</label>
            <input className="field" type="date" value={draft.dataSite === '-' ? '' : draft.dataSite}
              onChange={e => set('dataSite', e.target.value || '-')} style={{ maxWidth: 200 }} />

            <label>Data comercial</label>
            <input className="field" type="date" value={draft.dataComercial === '-' ? '' : draft.dataComercial}
              onChange={e => set('dataComercial', e.target.value || '-')} style={{ maxWidth: 200 }} />

            <label>Data final</label>
            <input className="field" type="date" value={draft.dataFinal}
              onChange={e => set('dataFinal', e.target.value)} style={{ maxWidth: 200 }} />

            <div className="modal-section-label">Marcos de produção</div>

            <label>Brainstorm</label>
            <div className="field-inline">
              <input className="field" type="date" value={draft.brainstormDate}
                onChange={e => set('brainstormDate', e.target.value)} style={{ width: 200 }} />
              <FieldCheckbox label="Concluído" value={!!draft.brainstormDone}
                onChange={v => set('brainstormDone', v)} />
            </div>

            <label>Aprov. comercial</label>
            <div className="field-inline">
              <input className="field" type="date" value={draft.aprovComercialDate}
                onChange={e => set('aprovComercialDate', e.target.value)} style={{ width: 200 }} />
              <FieldCheckbox label="Concluído" value={!!draft.aprovComercialDone}
                onChange={v => set('aprovComercialDone', v)} />
            </div>

            <label>Shooting</label>
            <div className="field-inline">
              <input className="field" type="date" value={draft.shootingDate}
                onChange={e => set('shootingDate', e.target.value)} style={{ width: 200 }} />
              <FieldCheckbox label="Concluído" value={!!draft.shootingDone}
                onChange={v => set('shootingDone', v)} />
            </div>

            <div className="modal-section-label">Status</div>

            <label>Progresso</label>
            <div className="field-inline">
              <input type="range" min="0" max="100" step="5" value={draft.progresso}
                onChange={e => set('progresso', Number(e.target.value))}
                style={{ flex: 1, maxWidth: 280 }} />
              <span style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums', minWidth: 40 }}>
                {draft.progresso}%
              </span>
            </div>

            <label>Lançada?</label>
            <FieldCheckbox label="Marcar como lançada" value={draft.launched}
              onChange={v => set('launched', v)} />
          </div>
        </div>

        <div className="modal-foot">
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleSave}>
            {isNew ? 'Criar campanha' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CollectionLinkSection ───────────────────────────────────
function CollectionLinkSection({ campaign, collections, pickerOpen, onTogglePicker, onLink, onCreate, onUnlink, onNavigate }: {
  campaign: Campaign
  collections: Collection[]
  pickerOpen: boolean
  onTogglePicker: () => void
  onLink: (id: number) => void
  onCreate: () => void
  onUnlink: () => void
  onNavigate: (id: number) => void
}) {
  const linked = campaign.colecaoId != null ? collections.find(c => c.id === campaign.colecaoId) : null
  const available = collections.filter(c => c.campaignId == null || c.campaignId === campaign.id)
  const tipo = linked ? COLECAO_TIPOS.find(t => t.id === linked.tipo) : null

  return (
    <div className="link-section" onClick={e => e.stopPropagation()} style={{ marginTop: 22 }}>
      <div className="link-section-head">
        <Icon.collections />
        <span className="link-section-label">Coleção</span>
        <span className="link-section-sub">
          {linked ? 'O progresso desta campanha é calculado pela coleção' : 'Toda campanha precisa de uma coleção para ter progresso automático'}
        </span>
      </div>
      {linked ? (
        <div className="link-chip-row">
          <button className="link-chip" onClick={() => onNavigate(linked.id)} type="button">
            <span className="link-chip-icon" style={{
              background: tipo ? `color-mix(in oklab, ${tipo.color}, white 80%)` : 'var(--accent-soft)',
              color: tipo ? tipo.color : 'var(--accent-deep)',
            }}>
              <Icon.collections />
            </span>
            <span className="link-chip-name">{linked.nome}</span>
            <span className="link-chip-meta">
              {tipo && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, background: `color-mix(in oklab, ${tipo.color}, white 88%)`, color: tipo.color }}>{tipo.label}</span>}
              <span>· abrir coleção</span>
              <Icon.chevR />
            </span>
          </button>
          <button className="link-unlink" onClick={onUnlink} type="button" title="Desvincular">
            <Icon.x />
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost link-add-btn" onClick={onTogglePicker} type="button">
            <Icon.plus /> Vincular coleção
          </button>
          {pickerOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={onTogglePicker} />
              <div className="link-picker">
                <div className="link-picker-head">Vincular a uma coleção</div>
                {available.length > 0 ? (
                  <div className="link-picker-list">
                    {available.map(col => {
                      const tp = COLECAO_TIPOS.find(t => t.id === col.tipo)!
                      return (
                        <button key={col.id} type="button" onClick={() => onLink(col.id)}>
                          <span style={{ width: 8, height: 8, borderRadius: 50, background: tp.color, flex: '0 0 8px' }} />
                          <span className="lp-name">{col.nome}</span>
                          <span className="lp-sub">{tp.label}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="link-picker-empty">Todas as coleções já têm campanha vinculada</div>
                )}
                <button type="button" className="link-picker-create" onClick={onCreate}>
                  <Icon.plus /> Criar nova coleção a partir desta campanha
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Campaign Card (galeria) ─────────────────────────────────
function CampaignCard({ campaign, posts, collections, effProg, onOpen, onPostsClick }: {
  campaign: Campaign
  posts: Post[]
  collections: Collection[]
  effProg: number
  onOpen: () => void
  onPostsClick: () => void
}) {
  const color = tipoColors[campaign.tipo] ?? '#999'
  const linkedCol = campaign.colecaoId != null ? collections.find(c => c.id === campaign.colecaoId) : null
  const postCount = posts.filter(p => p.campanha === campaign.slug).length
  const milestones = [
    { label: 'B', done: !!campaign.brainstormDone },
    { label: 'A', done: !!campaign.aprovComercialDone },
    { label: 'S', done: !!campaign.shootingDone },
  ]
  const today = todayISO()
  const isSoon = (d: string) => d && d !== '-' && d > today && d <= today.slice(0, 7) + '-31'

  return (
    <div className="camp-card" onClick={onOpen} style={{ '--tipo-color': color } as React.CSSProperties}>
      <div className="camp-card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`event-pack ${campaign.pack.toLowerCase()}`}>{campaign.pack}</span>
            <span style={{
              padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500,
              background: `color-mix(in oklab, ${color}, white 88%)`, color,
            }}>{campaign.tipo}</span>
          </div>
          {campaign.launched
            ? <span className="status-pill s-pub" style={{ fontSize: 11, padding: '2px 8px' }}><span className="sdot" />Lançado</span>
            : <span className="status-pill s-prod" style={{ fontSize: 11, padding: '2px 8px' }}><span className="sdot" />Pendente</span>
          }
        </div>

        <div className="camp-card-name">{campaign.nome}</div>
        {linkedCol && (
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon.collections /> {linkedCol.nome}
          </div>
        )}

        <div style={{ margin: '12px 0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Progresso</span>
            <span style={{ fontSize: 11, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{effProg}%</span>
          </div>
          <div className={`progress ${linkedCol ? 'from-link' : ''}`} style={{ height: 8 }}>
            <div style={{ width: `${effProg}%` }} />
          </div>
        </div>

        <div className="camp-card-dates">
          {[
            { label: 'Insta', val: campaign.dataInsta },
            { label: 'Site', val: campaign.dataSite },
            { label: 'Final', val: campaign.dataFinal },
          ].map(({ label, val }) => val && val !== '-' ? (
            <div key={label} className="camp-date-cell">
              <span className="camp-date-label">{label}</span>
              <span className={`camp-date-val ${isSoon(val) ? 'soon' : ''}`}>{fmtBR(val)}</span>
            </div>
          ) : null)}
        </div>
      </div>

      <div className="camp-card-footer">
        <span className="sb-avatar" style={{ width: 24, height: 24, fontSize: 12, flex: '0 0 24px' }}>
          {campaign.dono.charAt(0)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {campaign.dono}
        </span>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {milestones.map(m => (
            <span key={m.label} title={m.label} style={{
              width: 16, height: 16, borderRadius: '50%', fontSize: 9, fontWeight: 700,
              display: 'grid', placeItems: 'center',
              background: m.done ? 'oklch(0.6 0.13 150)' : 'var(--surface-3)',
              color: m.done ? 'white' : 'var(--ink-4)',
              border: `1.5px solid ${m.done ? 'oklch(0.6 0.13 150)' : 'var(--line-2)'}`,
            }}>{m.label}</span>
          ))}
        </div>

        <button
          className="camp-posts-btn"
          onClick={e => { e.stopPropagation(); onPostsClick() }}
          title="Ver posts vinculados"
        >
          {postCount} {postCount === 1 ? 'post' : 'posts'}
        </button>
      </div>
    </div>
  )
}

// ─── Campaigns View ──────────────────────────────────────────
interface CampaignsProps {
  posts: Post[]
  onPostClick: (post: Post) => void
  linking: Linking
  onNavigateCollection: (id: number) => void
}

export default function CampaignsView({ posts, onPostClick, linking, onNavigateCollection }: CampaignsProps) {
  const { collections, campaigns: items, setCampaigns: setItems,
    linkColCamp, unlinkColCamp, createCollectionFromCampaign,
    setCampaignLaunched } = linking

  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list')
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' })
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [linkedCampaign, setLinkedCampaign] = useState<Campaign | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [pickerOpen, setPickerOpen] = useState<number | null>(null)

  useEffect(() => {
    const h = (e: Event) => setExpanded((e as CustomEvent).detail)
    window.addEventListener('focusCampaign', h)
    return () => window.removeEventListener('focusCampaign', h)
  }, [])

  const getEffectiveProgress = (c: Campaign) => {
    if (c.colecaoId != null) {
      const col = collections.find(x => x.id === c.colecaoId)
      if (col) return colProgress(col)
    }
    return c.progresso
  }

  const updateCampaign = (id: number, patch: Partial<Campaign>) => {
    setItems(arr => arr.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  const addCampaign = (data: any) => {
    const id = items.reduce((m, c) => Math.max(m, c.id), 0) + 1
    setItems(arr => [...arr, { id, colecaoId: null, ...data } as Campaign])
  }

  const deleteCampaign = (id: number) => {
    setItems(arr => arr.filter(c => c.id !== id))
    setExpanded(null)
    setDeletingCampaign(null)
  }

  const archiveCampaign = (id: number) => {
    setItems(arr => arr.map(c => c.id === id ? { ...c, archived: true } : c))
    setExpanded(null)
    setDeletingCampaign(null)
  }

  const filtered = (filter === 'all' ? items
    : filter === 'launched' ? items.filter(i => i.launched)
    : filter === 'pending' ? items.filter(i => !i.launched)
    : items.filter(i => i.tipo === filter)
  ).filter(c => {
    const ref = c.dataInsta || c.previsao || ''
    const hasDateFilter = dateRange.from || dateRange.to
    if (!hasDateFilter && ref && ref < '2026-01-01') return false
    if (dateRange.from && ref && ref < dateRange.from) return false
    if (dateRange.to && ref && ref > dateRange.to) return false
    if (search && !c.nome.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <PackageInfoPanel />
        <div className="field link-field" style={{ width: 200 }}>
          <Icon.search />
          <input
            placeholder="Buscar"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: '0 4px' }} onClick={() => setSearch('')}><Icon.x /></button>}
        </div>
      </div>

      <div className="filter-bar" style={{ paddingTop: 16 }}>
        {[
          { id: 'all',      label: 'Todas' },
          { id: 'pending',  label: 'Aguardando', dot: 'oklch(0.62 0.13 75)' },
          { id: 'launched', label: 'Lançadas',   dot: 'oklch(0.6 0.13 150)' },
        ].map(f => (
          <button key={f.id} className={`platform-pill ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
            {'dot' in f && <span className="dot" style={{ background: f.dot }} />}
            {f.label}
          </button>
        ))}
        <div style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 6px' }} />
        {CAMP_TIPOS.map(t => (
          <button key={t} className={`platform-pill ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            <span className="dot" style={{ background: tipoColors[t] }} />
            {t}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <div className="view-toggle">
          <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>Lista</button>
          <button className={viewMode === 'gallery' ? 'active' : ''} onClick={() => setViewMode('gallery')}>Galeria</button>
        </div>
        <span className="count-pill">{filtered.length} {filtered.length === 1 ? 'campanha' : 'campanhas'}</span>
        <button className="btn btn-accent" onClick={() => setShowForm(true)}><Icon.plus /> Nova campanha</button>
      </div>

      {viewMode === 'gallery' ? (
        <div className="list-wrap">
          <div className="camp-grid">
            {filtered.map(c => {
              const effProg = getEffectiveProgress(c)
              return (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  posts={posts}
                  collections={collections}
                  effProg={effProg}
                  onOpen={() => { setViewMode('list'); setExpanded(c.id) }}
                  onPostsClick={() => setLinkedCampaign(c)}
                />
              )
            })}
          </div>
        </div>
      ) : null}

      {viewMode === 'list' ? (
      <div className="list-wrap">
        <div className="list">
          <div className="list-row list-head" style={{ gridTemplateColumns: '32px 2.4fr 90px 1.2fr 1.5fr 0.85fr 1.2fr 1.5fr 1.1fr' }}>
            <div className="cell" />
            <div className="cell">Campanha</div>
            <div className="cell">Pacote</div>
            <div className="cell">Dono</div>
            <div className="cell">Tipo</div>
            <div className="cell">Mês</div>
            <div className="cell">Data Insta</div>
            <div className="cell">Status</div>
            <div className="cell">Progresso</div>
          </div>

          {filtered.map(c => {
            const isOpen = expanded === c.id
            const effProg = getEffectiveProgress(c)
            const linkedColecao = c.colecaoId != null ? collections.find(x => x.id === c.colecaoId) : null
            return (
              <div key={c.id}>
                <div
                  className={`list-row expandable ${isOpen ? 'expanded' : ''}`}
                  style={{ gridTemplateColumns: '32px 2.4fr 90px 1.2fr 1.5fr 0.85fr 1.2fr 1.5fr 1.1fr' }}
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                >
                  <div className="cell" style={{ padding: '14px 0 14px 16px' }}>
                    <span style={{
                      display: 'inline-grid', placeItems: 'center',
                      width: 24, height: 24, borderRadius: 999,
                      color: 'var(--ink-3)',
                      transition: 'transform .2s',
                      transform: isOpen ? 'rotate(0)' : 'rotate(-90deg)',
                    }}>
                      <Icon.chevD />
                    </span>
                  </div>
                  <div className="cell" style={{ fontWeight: 500, fontSize: 13 }}>
                    {c.nome}
                    {linkedColecao && (
                      <span className="link-badge" title={`Coleção vinculada: ${linkedColecao.nome}`}>
                        <Icon.collections /> Coleção
                      </span>
                    )}
                  </div>
                  <div className="cell"><span className={`event-pack ${c.pack.toLowerCase()}`}>{c.pack}</span></div>
                  <div className="cell">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className="sb-avatar" style={{ width: 24, height: 24, fontSize: 13, flex: '0 0 24px' }}>{c.dono.charAt(0)}</span>
                      {c.dono}
                    </span>
                  </div>
                  <div className="cell">
                    <span style={{
                      padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                      background: `color-mix(in oklab, ${tipoColors[c.tipo] ?? '#999'}, white 88%)`,
                      color: tipoColors[c.tipo] ?? '#999',
                    }}>{c.tipo}</span>
                  </div>
                  <div className="cell" style={{ color: 'var(--ink-2)' }}>{c.mes}</div>
                  <div className="cell" style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{fmtBR(c.dataInsta)}</div>
                  <div className="cell">
                    {c.launched
                      ? <span className="status-pill s-pub"><span className="sdot" />Lançado</span>
                      : <span className="status-pill s-prod"><span className="sdot" />Aguardando</span>
                    }
                  </div>
                  <div className="cell">
                    {linkedColecao ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="progress from-link" style={{ flex: 1 }}>
                          <div style={{ width: `${effProg}%` }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--ink-3)', minWidth: 30, textAlign: 'right', fontVariantNumeric: 'tabular-nums', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {effProg}%
                          <span className="link-icon-mini" title="Calculado pela coleção"><Icon.link /></span>
                        </span>
                      </div>
                    ) : (
                      <button
                        className="progress-missing"
                        onClick={(e) => { e.stopPropagation(); setExpanded(c.id); setPickerOpen(c.id) }}
                        title="Toda campanha precisa de uma coleção"
                      >
                        <span className="pm-dot" />
                        <span>Vincule uma coleção</span>
                      </button>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="list-expansion">
                    <div className="exp-grid">
                      {[
                        ['Previsão de lançamento', fmtBR(c.previsao)],
                        ['Data site', fmtBR(c.dataSite)],
                        ['Data Instagram', fmtBR(c.dataInsta)],
                        ['Data comercial', fmtBR(c.dataComercial)],
                        ['Data final', fmtBR(c.dataFinal)],
                        ['Mês foco', c.mes],
                      ].map(([label, value]) => (
                        <div key={label} className="exp-cell">
                          <label>{label}</label>
                          <div className="v">{value}</div>
                        </div>
                      ))}
                      <div className="exp-cell">
                        <label>Pacote</label>
                        <div className="v"><span className={`event-pack ${c.pack.toLowerCase()}`}>{c.pack}</span></div>
                      </div>
                      <div className="exp-cell">
                        <label>
                          Conclusão {linkedColecao && <span style={{ color: 'var(--accent-deep)' }}>· vem da coleção</span>}
                        </label>
                        {linkedColecao ? (
                          <div className="v" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress from-link" style={{ flex: 1, maxWidth: 130 }}>
                              <div style={{ width: `${effProg}%` }} />
                            </div>
                            <span style={{ fontSize: 11 }}>{effProg}%</span>
                          </div>
                        ) : (
                          <div className="v" style={{ fontSize: 12.5, color: 'oklch(0.55 0.18 25)', fontWeight: 500 }}>
                            Sem coleção vinculada
                          </div>
                        )}
                      </div>
                    </div>

                    <CollectionLinkSection
                      campaign={c}
                      collections={collections}
                      pickerOpen={pickerOpen === c.id}
                      onTogglePicker={() => setPickerOpen(pickerOpen === c.id ? null : c.id)}
                      onLink={colId => { linkColCamp(colId, c.id); setPickerOpen(null) }}
                      onCreate={() => { createCollectionFromCampaign(c); setPickerOpen(null) }}
                      onUnlink={() => unlinkColCamp(c.colecaoId!, c.id)}
                      onNavigate={onNavigateCollection}
                    />

                    <div style={{ marginTop: 22 }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Marcos de produção
                      </div>
                      <Milestones campaign={c} onChange={(patch) => updateCampaign(c.id, patch)} />
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
                      <button
                        className="btn btn-accent"
                        onClick={e => { e.stopPropagation(); setLinkedCampaign(c) }}
                      >
                        <Icon.link /> Ver posts vinculados
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={e => { e.stopPropagation(); setEditingCampaign(c) }}
                      >
                        Editar campanha
                      </button>
                      <FieldCheckbox label="Lançada (já no site)"
                        value={c.launched}
                        onChange={v => setCampaignLaunched(c.id, v)} />
                      <div style={{ flex: 1 }} />
                      <button className="btn btn-ghost" style={{ color: 'var(--ink-3)' }} onClick={e => { e.stopPropagation(); setDeletingCampaign(c) }}>
                        <Icon.trash /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      ) : null}

      {linkedCampaign && (
        <LinkedPostsDrawer
          campaign={linkedCampaign}
          posts={posts}
          onClose={() => setLinkedCampaign(null)}
          onPostClick={p => { setLinkedCampaign(null); onPostClick(p) }}
        />
      )}

      {showForm && (
        <CampaignFormModal onClose={() => setShowForm(false)} onSave={addCampaign} />
      )}

      {editingCampaign && (
        <CampaignFormModal
          initial={editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onSave={(c) => updateCampaign(c.id, c)}
        />
      )}

      {deletingCampaign && (
        <div className="modal-backdrop" onClick={() => setDeletingCampaign(null)}>
          <div className="modal" style={{ width: 'min(440px, calc(100vw - 40px))', maxHeight: 'unset' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head" style={{ borderBottom: 'none', paddingBottom: 8 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flex: '0 0 44px',
                background: 'oklch(0.95 0.03 20)', display: 'grid', placeItems: 'center',
                color: 'oklch(0.52 0.18 22)',
              }}>
                <Icon.trash />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.015em' }}>
                  Excluir campanha?
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>
                  "{deletingCampaign.nome}"
                </div>
              </div>
              <button className="modal-close" onClick={() => setDeletingCampaign(null)}><Icon.x /></button>
            </div>

            <div style={{ padding: '4px 26px 20px', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              Essa ação é permanente e não pode ser desfeita. Todos os dados da campanha serão removidos.
              <br /><br />
              Se preferir manter o histórico, você pode <strong>arquivar</strong> a campanha em vez de excluir.
            </div>

            <div className="modal-foot" style={{ justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setDeletingCampaign(null)}>Cancelar</button>
              <button
                className="btn btn-ghost"
                style={{ color: 'oklch(0.5 0.12 230)', borderColor: 'oklch(0.88 0.04 230)' }}
                onClick={() => archiveCampaign(deletingCampaign.id)}
              >
                Arquivar
              </button>
              <button
                className="btn"
                style={{ background: 'oklch(0.52 0.18 22)', color: 'white' }}
                onClick={() => deleteCampaign(deletingCampaign.id)}
              >
                <Icon.trash /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
