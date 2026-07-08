export type Platform = 'ig' | 'tiktok' | 'canal' | 'twitter' | 'youtube'
export type PostStatus = 'prod' | 'sched' | 'pub' | 'cancel' | 'pauta' | 'entregue'
export type PostSource = 'mh' | 'branding' | 'tiktok' | 'twitter' | 'canal' | 'copa'
export type MHCreatorId = 'CARINA' | 'REBECA' | 'THA' | 'MARINA' | 'RECICLADO'
export type Brand = 'gocase' | 'barbours' | 'kokeshi' | 'lescent'

interface BrandTheme {
  color: string
  accent:          string
  accentDeep:      string
  accentSoft:      string
  accentSofter:    string
  accentGradient:  string
  accentGradientSoft:   string
  accentGradientSofter: string
}

export const BRANDS: { slug: Brand; name: string; color: string; theme: BrandTheme }[] = [
  {
    slug: 'gocase', name: 'Gocase', color: '#F97316',
    theme: {
      color:                  '#F97316',
      accent:                 'oklch(0.72 0.16 55)',
      accentDeep:             'oklch(0.62 0.18 50)',
      accentSoft:             'oklch(0.94 0.05 60)',
      accentSofter:           'oklch(0.975 0.025 65)',
      accentGradient:         'linear-gradient(135deg, oklch(0.78 0.13 40) 0%, oklch(0.72 0.16 55) 100%)',
      accentGradientSoft:     'linear-gradient(135deg, oklch(0.96 0.04 35) 0%, oklch(0.93 0.07 55) 100%)',
      accentGradientSofter:   'linear-gradient(135deg, oklch(0.98 0.02 30) 0%, oklch(0.96 0.04 55) 100%)',
    },
  },
  {
    slug: 'barbours', name: "Barbour's", color: '#EF4444',
    theme: {
      color:                  '#EF4444',
      accent:                 'oklch(0.63 0.21 27)',
      accentDeep:             'oklch(0.53 0.23 27)',
      accentSoft:             'oklch(0.94 0.05 25)',
      accentSofter:           'oklch(0.975 0.02 25)',
      accentGradient:         'linear-gradient(135deg, oklch(0.68 0.20 20) 0%, oklch(0.63 0.21 27) 100%)',
      accentGradientSoft:     'linear-gradient(135deg, oklch(0.96 0.03 20) 0%, oklch(0.93 0.06 27) 100%)',
      accentGradientSofter:   'linear-gradient(135deg, oklch(0.98 0.015 20) 0%, oklch(0.96 0.03 27) 100%)',
    },
  },
  {
    slug: 'kokeshi', name: 'Kokeshi', color: '#EC4899',
    theme: {
      color:                  '#EC4899',
      accent:                 'oklch(0.65 0.22 350)',
      accentDeep:             'oklch(0.55 0.24 350)',
      accentSoft:             'oklch(0.94 0.05 350)',
      accentSofter:           'oklch(0.975 0.02 350)',
      accentGradient:         'linear-gradient(135deg, oklch(0.70 0.20 345) 0%, oklch(0.65 0.22 350) 100%)',
      accentGradientSoft:     'linear-gradient(135deg, oklch(0.96 0.03 345) 0%, oklch(0.93 0.06 350) 100%)',
      accentGradientSofter:   'linear-gradient(135deg, oklch(0.98 0.015 345) 0%, oklch(0.96 0.03 350) 100%)',
    },
  },
  {
    slug: 'lescent', name: 'Lescent', color: '#4B5563',
    theme: {
      color:                  '#4B5563',
      accent:                 'oklch(0.45 0.02 255)',
      accentDeep:             'oklch(0.35 0.025 255)',
      accentSoft:             'oklch(0.93 0.01 255)',
      accentSofter:           'oklch(0.97 0.005 255)',
      accentGradient:         'linear-gradient(135deg, oklch(0.50 0.02 250) 0%, oklch(0.45 0.02 255) 100%)',
      accentGradientSoft:     'linear-gradient(135deg, oklch(0.95 0.008 250) 0%, oklch(0.93 0.01 255) 100%)',
      accentGradientSofter:   'linear-gradient(135deg, oklch(0.975 0.004 250) 0%, oklch(0.97 0.005 255) 100%)',
    },
  },
]

export interface Post {
  id: string           // uuid
  source: PostSource
  title: string
  owner: string
  platform: Platform
  date: string         // YYYY-MM-DD
  time: string         // HH:mm
  status: PostStatus
  format: string
  month?: number
  tags: string[]       // linha editorial / categorias (ex: trends, produtos, campanhas)
  campaign: string
  product: string
  ref: string
  link: string         // link do post publicado
  obs: string
  deadline: string
  caption: string
  videoLink: string
  coverLink: string
  slideLinks?: string[]  // até 10 imagens para posts no formato Carrossel
  linkedPostId?: string
  linkedPostSource?: PostSource
  archived?: boolean
  // MH-specific (só presente em source === 'mh')
  semana?: number
  numVideo?: number
  audio?: string
  prazo?: string
  dropboxLink?: string
  briefingFile?: string
}

// ─── Canal (WhatsApp/Telegram) ───────────────────────────────
export type CanalTag = 'Engajamento' | 'Lançamento' | 'Promocional' | 'Institucional' | string

export interface CanalPost {
  id: string
  date: string         // YYYY-MM-DD
  time: string         // HH:mm
  title: string
  content: string      // mensagem completa (caption no DB)
  tag: CanalTag
  campaign: string
  cupom: string
  cupomUtm: string
  revenue: number | null
  receitaUtm: number | null
  status: PostStatus
  obs: string
  owner: string
  brand: Brand
}

// Mantido para retrocompatibilidade com o briefing API (MHView usa MHPayload)
export interface MHRepostTT {
  date: string
  time: string
  status: string
  type: string
}

export interface MHPayload {
  creator: MHCreatorId
  semanaCreator: number
  numVideo: number
  audio: string
  prazo: string
  dropboxLink: string
  briefingFile: string
  repostTT: MHRepostTT | null
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
  archived?: boolean
}

export interface ExtraTask {
  id: string
  label: string
  done: boolean
}

export interface IlustraData {
  status: string
  criacao: boolean
  adaptacao: boolean
  aprovEnabled: boolean
  aprov: boolean
  cadastro: boolean
  extraTasks?: ExtraTask[]
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
  extraTasks?: ExtraTask[]
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
  createCampaignFromCollection: (collection: Collection) => Promise<Campaign>
  createCollectionFromCampaign: (campaign: Campaign) => Promise<Collection>
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
  notes: string
}

export interface TeamProfile {
  id: string        // mapeia para post.owner (ex: "Duda", "Kel")
  name: string      // nome de exibição
  role: string
  email: string
  joined: string
  color: string
  initial: string
  isMe?: boolean
  avatarUrl?: string   // foto do Google (ou upload customizado)
  supabaseId?: string  // UUID do auth.users
}

export const PLATFORMS = [
  { id: 'ig' as Platform,      label: 'Instagram', color: '#E1306C' },
  { id: 'tiktok' as Platform,  label: 'TikTok',    color: '#111111' },
  { id: 'canal' as Platform,   label: 'Canal',     color: '#FF0033' },
  { id: 'twitter' as Platform,  label: 'Twitter',   color: '#111111' },
  { id: 'youtube' as Platform,  label: 'YouTube',   color: '#FF0000' },
]

export const STATUSES = [
  { id: 'prod'     as PostStatus, label: 'Em produção', className: 's-prod'     },
  { id: 'sched'    as PostStatus, label: 'Agendado',    className: 's-sched'    },
  { id: 'pub'      as PostStatus, label: 'Publicado',   className: 's-pub'      },
  { id: 'cancel'   as PostStatus, label: 'Cancelado',   className: 's-cancel'   },
  { id: 'pauta'    as PostStatus, label: 'Em pauta',    className: 's-pauta'    },
  { id: 'entregue' as PostStatus, label: 'Entregue',    className: 's-entregue' },
]

export const SOURCES = [
  { id: 'branding' as PostSource, label: 'Branding'         },
  { id: 'mh'       as PostSource, label: 'Máquina de Hits'   },
  { id: 'copa'     as PostSource, label: 'Futebol'           },
  { id: 'canal'    as PostSource, label: 'Canal'             },
  { id: 'tiktok'   as PostSource, label: 'TikTok'            },
  { id: 'twitter'  as PostSource, label: 'Twitter'           },
]

export const TAGS = [
  { id: 'campanha', label: 'Campanha' },
  { id: 'branding', label: 'Branding' },
  { id: 'mh',       label: 'MH'       },
  { id: 'futebol',  label: 'Futebol'  },
]

export const LINHAS_ED = [
  { id: 'produtos',          label: 'Produtos'           },
  { id: 'asmr',             label: 'ASMR'               },
  { id: 'escritorio',       label: 'Escritório'          },
  { id: 'trends',           label: 'Trends'             },
  { id: 'combinando',       label: 'Combinando Capinhas' },
  { id: 'teste_cabe',       label: 'Teste o que cabe'   },
  { id: 'julgando',         label: 'Julgando'           },
  { id: 'copa',             label: 'Copa'               },
  { id: 'godivas',          label: 'Godivas'            },
  { id: 'campanhas',        label: 'Campanhas'          },
  { id: 'futebol',          label: 'Futebol'            },
]

export const CAMP_LIST = [
  { id: 'copa',      label: 'Copa 2026'        },
  { id: 'care',      label: 'Linha Care'        },
  { id: 'namorados', label: 'Dia dos Namorados' },
  { id: 'maes',      label: 'Dia das Mães'      },
]

export const CONTENT_TYPES_IG      = ['Reels', 'Carrossel', 'Imagem', 'Story']
export const CONTENT_TYPES_OTHER   = ['Vídeo', 'Imagem', 'Texto']
export const CONTENT_TYPES_YOUTUBE = ['Vídeo', 'Shorts']

export const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
export const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
export const WEEKDAYS_FULL = ['Dom.','Seg.','Ter.','Qua.','Qui.','Sex.','Sáb.']
export const MONTH_ABBR = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

export type AppView = 'calendar' | 'stories' | 'branding' | 'mh' | 'comemorativas' | 'futebol' | 'campaigns' | 'collections' | 'profile' | 'lives' | 'archived' | 'canal' | 'site_links' | 'metrics' | 'share_social' | 'metas'

// ─── Site Links ───────────────────────────────────────────────

export interface SiteLink {
  id: string
  brand: Brand
  categoria: string
  produto: string
  link: string
}

// ─── Lives ────────────────────────────────────────────────────

export type LiveStatus = 'realizada' | 'confirmada' | 'proposta'

export interface Live {
  id: string           // uuid
  date: string         // YYYY-MM-DD
  hora: string         // HH:mm
  diaSemana: string
  cupomLigado: boolean
  criativo: string
  merchan1: string
  nominal1: string
  receita1: number
  merchan2: string
  nominal2: string
  receita2: number
  cupomExtra: string
  receitaExtra: number
  receitaTotal: number  // = receita1 + receita2 (nunca soma receitaUtm — cupom e UTM podem se sobrepor)
  receitaUtm: number
  ordersCupom: number | null
  ordersUtm: number | null
  ordersTotal: number | null
  alcance: number
  produto: string
  linkUtm: string
  utmCampaign: string
  status: LiveStatus
  origem: string
  notes: string
}

export interface Merchan {
  id: string           // uuid
  nome: string         // ex: "DESCONTO + FRETE GRÁTIS + 3X SEM JUROS"
  name: string         // alias for nome (compat with design)
  ativo: boolean
  forte: boolean
  sempreSozinho: boolean
  color: string        // oklch, derived from nome
  short: string        // abbreviated label, e.g. "D+FG+3X"
}

export const LIVE_STATUSES = [
  { id: 'proposta'   as LiveStatus, label: 'Proposta',   className: 's-prop', dot: 'oklch(0.72 0.16 55)' },
  { id: 'confirmada' as LiveStatus, label: 'Confirmada', className: 's-conf', dot: 'oklch(0.6 0.13 265)'  },
  { id: 'realizada'  as LiveStatus, label: 'Realizada',  className: 's-pub',  dot: 'oklch(0.6 0.13 150)'  },
] as const

export const LIVE_STATUS_BY_ID = Object.fromEntries(LIVE_STATUSES.map(s => [s.id, s])) as Record<LiveStatus, typeof LIVE_STATUSES[number]>
export type CalendarMode = 'month' | 'week' | 'list'

export const pad = (n: number) => String(n).padStart(2, '0')
export const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
export const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const fmtBR = (iso: string) => { if (!iso || iso === '-') return '—'; const d = parseISO(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` }
export const addDaysISO = (iso: string, n: number) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d.getFullYear(), d.getMonth(), d.getDate()) }
export const startOfWeekISO = (iso: string) => { const d = parseISO(iso); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return toISO(d.getFullYear(), d.getMonth(), d.getDate()) }
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

// ---- Stories Analytics ----

export type StoryStatus = 'nao_iniciado' | 'em_andamento' | 'feito' | 'nao_postado' | 'proposta' | 'postado'

export interface Story {
  id: string
  date: string          // YYYY-MM-DD
  hora: number          // 14
  diaSemana: string
  utm: string
  produto: string
  produtoSlug: string   // derivado: sem acentos, lowercase, sem espaços
  categoria: string
  status: StoryStatus
  linkMidia: string | null
  linkUtm: string | null
  rastreioReceita: string | null
  receita: number | null
  orders: number | null
  notes: string | null
  origem: string
}

export interface DayAggregate {
  id: string
  date: string
  alcance: number
  visualizacoes: number
  respostas: number
  compartilhamentos: number
  visitasPerfil: number
}


export type RenderJobStatus = 'queued' | 'running' | 'done' | 'error'

export interface RenderJob {
  id: string
  semanaInicio: string
  triggeredBy: string | null
  status: RenderJobStatus
  videosProcessados: number
  videosFalhos: number
  dropboxUrl: string | null
  errorMessage: string | null
  startedAt: string | null
  endedAt: string | null
  createdAt: string
  updatedAt: string
}
