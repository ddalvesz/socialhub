export type Platform = 'ig' | 'tiktok' | 'canal' | 'twitter'
export type PostStatus = 'prod' | 'sched' | 'pub' | 'cancel'

export interface Post {
  id: number
  title: string
  owner: string
  platform: Platform
  date: string     // YYYY-MM-DD
  time: string     // HH:mm
  status: PostStatus
  complexity: number  // 1-5
  type: string
  tags: string[]
  linha: string
  campanha: string | null
  link: string
  ref: string
  notes: string
  caption?: string
  product?: string
  image_urls?: string[]
  user_id?: string
}

export interface Campaign {
  id: number
  slug: string
  nome: string
  pack: 'PP' | 'P' | 'M' | 'G'
  dono: string
  tipo: string
  mes: string
  dataInsta: string
  dataSite: string
  dataComercial: string
  dataFinal: string
  previsao: string
  launched: boolean
  progresso: number
  brainstormDate?: string
  brainstormDone?: boolean
  aprovComercialDate?: string
  aprovComercialDone?: boolean
  shootingDate?: string
  shootingDone?: boolean
  colecaoId?: number | null
}

export interface IlustraData {
  status: string
  criacao: boolean
  adaptacao: boolean
  aprovEnabled: boolean
  aprov: boolean
  cadastro: boolean
}

export interface MarketingData {
  status: string
  pack: 'PP' | 'P' | 'M' | 'G'
  dono: string
  banner: boolean
  pedidoEnabled: boolean; pedido: boolean
  loadingEnabled: boolean; loading: boolean
  postEnabled: boolean; post: boolean
  carrosselEnabled: boolean; carrossel: boolean
  reelsEnabled: boolean; reels: boolean
  trincaEnabled: boolean; trinca: boolean
  shootingEnabled: boolean; shooting: boolean
  storiesEnabled: boolean; stories: boolean
  influsEnabled: boolean; influs: boolean
}

export interface Collection {
  id: number
  nome: string
  tipo: string
  mes: string
  dataSite: string
  dataMarketing: string
  confirmado: string
  launched: boolean
  ilustra: IlustraData
  marketing: MarketingData
  campaignId?: number | null
}

export const COLECAO_TIPOS = [
  { id: 'licenciamento', label: 'Licenciamento', color: 'oklch(0.55 0.13 285)' },
  { id: 'autoral',       label: 'Autoral',       color: 'oklch(0.55 0.13 165)' },
  { id: 'sustentacao',   label: 'Sustentação',   color: 'oklch(0.55 0.13 230)' },
  { id: 'artista',       label: 'Artista',       color: 'oklch(0.55 0.13 25)'  },
]

export const COL_STATUS = [
  { id: 'naoIniciada', label: 'Não iniciada', color: 'oklch(0.62 0.012 300)' },
  { id: 'criacao',     label: 'Em criação',   color: 'oklch(0.6 0.13 265)'   },
  { id: 'aprovacao',   label: 'Aprovação',    color: 'oklch(0.62 0.13 75)'   },
  { id: 'atrasada',    label: 'Atrasada',     color: 'oklch(0.55 0.18 25)'   },
]

export const COL_CONFIRMADO = [
  { id: 'ok',         label: 'Confirmada',    color: 'oklch(0.6 0.13 150)'  },
  { id: 'negociacao', label: 'Em negociação', color: 'oklch(0.62 0.13 75)'  },
  { id: 'cancelada',  label: 'Cancelada',     color: 'oklch(0.6 0.05 25)'   },
]

export const ILUSTRA_TASKS = [
  { key: 'criacao',   label: 'Criação das estampas',  optional: false },
  { key: 'adaptacao', label: 'Adaptação',              optional: false },
  { key: 'aprov',     label: 'Aprovação das estampas', optional: true  },
  { key: 'cadastro',  label: 'Cadastro',               optional: false },
]

export const MKT_TASKS = [
  { key: 'banner',    label: 'Banner',             optional: false },
  { key: 'pedido',    label: 'Pedido de conteúdo', optional: true  },
  { key: 'loading',   label: 'Loading page',       optional: true  },
  { key: 'post',      label: 'Post estático',      optional: true  },
  { key: 'carrossel', label: 'Carrossel',          optional: true  },
  { key: 'reels',     label: 'Reels',              optional: true  },
  { key: 'trinca',    label: 'Trinca de conteúdo', optional: true  },
  { key: 'shooting',  label: 'Mini shooting',      optional: true  },
  { key: 'stories',   label: 'Stories',            optional: true  },
  { key: 'influs',    label: 'Influs',             optional: true  },
]

export interface Linking {
  collections: Collection[]
  campaigns: Campaign[]
  setCollections: (fn: (arr: Collection[]) => Collection[]) => void
  setCampaigns: (fn: (arr: Campaign[]) => Campaign[]) => void
  linkColCamp: (collectionId: number, campaignId: number) => void
  unlinkColCamp: (collectionId: number, campaignId: number) => void
  createCampaignFromCollection: (collection: Collection) => Campaign
  createCollectionFromCampaign: (campaign: Campaign) => Collection
  setCollectionLaunched: (collectionId: number, launched: boolean) => void
  setCampaignLaunched: (campaignId: number, launched: boolean) => void
}

export function colProgress(c: Collection): number {
  let total = 0, done = 0
  ILUSTRA_TASKS.forEach(t => {
    const enabled = t.optional ? !!(c.ilustra as any)[`${t.key}Enabled`] : true
    if (enabled) { total++; if ((c.ilustra as any)[t.key]) done++ }
  })
  MKT_TASKS.forEach(t => {
    const enabled = t.optional ? !!(c.marketing as any)[`${t.key}Enabled`] : true
    if (enabled) { total++; if ((c.marketing as any)[t.key]) done++ }
  })
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

export interface EventDate {
  id: number
  type: string
  name: string
  start: string
  end: string
  pack: 'PP' | 'P' | 'M' | 'G'
  potencial: boolean
  postado: boolean
  format: string
}

export interface FutebolEvent {
  id: number
  type: string
  name: string
  date: string
}

export interface TeamProfile {
  id: string
  name: string
  role: string
  email: string
  joined: string
  color: string
  initial: string
  isMe?: boolean
}

export const PLATFORMS = [
  { id: 'ig' as Platform,      label: 'Instagram', color: '#E1306C' },
  { id: 'tiktok' as Platform,  label: 'TikTok',    color: '#111111' },
  { id: 'canal' as Platform,   label: 'Canal',     color: '#FF0033' },
  { id: 'twitter' as Platform, label: 'Twitter',   color: '#111111' },
]

export const STATUSES = [
  { id: 'prod'   as PostStatus, label: 'Em produção', className: 's-prod'   },
  { id: 'sched'  as PostStatus, label: 'Agendado',    className: 's-sched'  },
  { id: 'pub'    as PostStatus, label: 'Publicado',   className: 's-pub'    },
  { id: 'cancel' as PostStatus, label: 'Cancelado',   className: 's-cancel' },
]

export const TAGS = [
  { id: 'campanha', label: 'Campanha' },
  { id: 'branding', label: 'Branding' },
  { id: 'mh',       label: 'MH'       },
  { id: 'futebol',  label: 'Futebol'  },
]

export const LINHAS_ED = [
  { id: 'escritorio', label: 'Escritório' },
  { id: 'produtos',   label: 'Produtos'   },
  { id: 'trends',     label: 'Trends'     },
  { id: 'asmr',       label: 'ASMR'       },
  { id: 'ads',        label: 'Ads'        },
]

export const CAMP_LIST = [
  { id: 'copa',      label: 'Copa 2026'        },
  { id: 'care',      label: 'Linha Care'        },
  { id: 'namorados', label: 'Dia dos Namorados' },
  { id: 'maes',      label: 'Dia das Mães'      },
]

export const CONTENT_TYPES_IG    = ['Reels', 'Carrossel', 'Imagem', 'Story']
export const CONTENT_TYPES_OTHER = ['Vídeo', 'Imagem', 'Texto']

export const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
export const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
export const WEEKDAYS_FULL = ['Dom.','Seg.','Ter.','Qua.','Qui.','Sex.','Sáb.']
export const MONTH_ABBR = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

export type AppView = 'calendar' | 'stories' | 'branding' | 'mh' | 'comemorativas' | 'futebol' | 'campaigns' | 'collections' | 'profile'
export type CalendarMode = 'month' | 'week'

export const pad = (n: number) => String(n).padStart(2, '0')
export const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
export const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const fmtBR = (iso: string) => { if (!iso || iso === '-') return '—'; const d = parseISO(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` }
export const addDaysISO = (iso: string, n: number) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d.getFullYear(), d.getMonth(), d.getDate()) }
export const startOfWeekISO = (iso: string) => { const d = parseISO(iso); d.setDate(d.getDate() - d.getDay()); return toISO(d.getFullYear(), d.getMonth(), d.getDate()) }
export const todayISO = () => { const n = new Date(); return toISO(n.getFullYear(), n.getMonth(), n.getDate()) }

export function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonth = new Date(year, month, 0)
  const daysInPrev = prevMonth.getDate()
  const cells: { day: number; iso: string; other: boolean }[] = []
  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrev - i
    cells.push({ day: d, iso: toISO(prevMonth.getFullYear(), prevMonth.getMonth(), d), other: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, iso: toISO(year, month, d), other: false })
  }
  const next = new Date(year, month + 1, 1)
  let d = 1
  while (cells.length < 42) {
    cells.push({ day: d, iso: toISO(next.getFullYear(), next.getMonth(), d), other: true })
    d++
  }
  return cells
}

export const PACKAGE_INFO = [
  {
    id: 'G',
    nome: 'G — Voz da Marca',
    objetivo: 'Construção de marca e posicionamento',
    mensagem: 'Mensagem conduz a narrativa. Produto apoia a história.',
    complexidade: 'Muito alta', fogo: 3,
    processos: [
      'Briefing estratégico (branding + negócio)',
      'Construção de narrativa e conceito macro',
      'Alinhamento com liderança e áreas parceiras',
      'Planejamento 360º (orgânico, pago, PR, influenciadores)',
    ],
    entregaveis: [
      'Vídeo hero (storytelling)',
      'Identidade visual da campanha',
      'Shooting dedicado (foto + vídeo)',
      'Reels e posts estáticos',
      'Influenciadores (curadoria + ativações)',
      'Email marketing',
      'Banners',
      'Kit de campanha (guia de assets e desdobramentos pra mídia)',
    ],
  },
  {
    id: 'M',
    nome: 'M — Campanha de superioridade',
    objetivo: 'Superioridade e diferenciação',
    mensagem: 'Produto é protagonista. Mensagem reforça benefícios.',
    complexidade: 'Alta', fogo: 2,
    processos: [
      'Briefing focado em produto + performance',
      'Definição de ângulo criativo (benefício principal)',
      'Planejamento de canais prioritários',
    ],
    entregaveis: [
      'Vídeo principal de produto',
      'Shooting de produto',
      'Key visual',
      'Reels e posts estáticos',
      'Stories',
      'Influenciadores (escala média)',
      'Banners',
      'Email marketing',
    ],
  },
  {
    id: 'P',
    nome: 'P — Campanha Tática',
    objetivo: 'Sustentação de calendário',
    mensagem: 'Comunicação direta. Sem storytelling.',
    complexidade: 'Média', fogo: 1,
    processos: [
      'Briefing tático',
      'Adaptação de identidade existente',
      'Planejamento simples de canais',
    ],
    entregaveis: [
      'KV simples ou adaptação',
      'Foto de produto com IA',
      '1–2 Reels de produção interna',
      'Posts estáticos',
      'Stories',
      'Banner',
    ],
  },
  {
    id: 'PP',
    nome: 'PP — Drop de Cor',
    objetivo: 'Novidade rápida e conversão',
    mensagem: 'Reforço de mensagem existente. Apenas execução visual.',
    complexidade: 'Baixa', fogo: 0,
    processos: [
      'Briefing rápido',
      'Execução direta (sem conceito macro)',
    ],
    entregaveis: [
      'Post estático ou carrossel simples',
      'Stories',
      'Banner na categoria existente',
    ],
  },
]

export const FORMATS_LIST = ['Story', 'Estático', 'Coleção', 'Reels', 'Campanha']
