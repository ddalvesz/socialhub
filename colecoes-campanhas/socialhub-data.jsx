/* ---- Constants ported from lib/types.ts ---- */
const PLATFORMS = [
  { id: 'ig',      label: 'Instagram', color: '#E1306C' },
  { id: 'tiktok',  label: 'TikTok',    color: '#111111' },
  { id: 'canal',   label: 'Canal',     color: '#FF0033' },
  { id: 'twitter', label: 'Twitter',   color: '#111111' },
];
const STATUSES = [
  { id: 'prod',   label: 'Em produção', className: 's-prod'   },
  { id: 'sched',  label: 'Agendado',    className: 's-sched'  },
  { id: 'pub',    label: 'Publicado',   className: 's-pub'    },
  { id: 'cancel', label: 'Cancelado',   className: 's-cancel' },
];
const TAGS = [
  { id: 'campanha', label: 'Campanha' },
  { id: 'branding', label: 'Branding' },
  { id: 'mh',       label: 'MH'       },
  { id: 'futebol',  label: 'Futebol'  },
];
const LINHAS_ED = [
  { id: 'escritorio', label: 'Escritório' },
  { id: 'produtos',   label: 'Produtos'   },
  { id: 'trends',     label: 'Trends'     },
  { id: 'asmr',       label: 'ASMR'       },
  { id: 'ads',        label: 'Ads'        },
];
const CAMP_LIST = [
  { id: 'copa',      label: 'Copa 2026'        },
  { id: 'care',      label: 'Linha Care'        },
  { id: 'namorados', label: 'Dia dos Namorados' },
  { id: 'maes',      label: 'Dia das Mães'      },
];
const CONTENT_TYPES_IG    = ['Reels', 'Carrossel', 'Imagem', 'Story'];
const CONTENT_TYPES_OTHER = ['Vídeo', 'Imagem', 'Texto'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const WEEKDAYS_FULL = ['Dom.','Seg.','Ter.','Qua.','Qui.','Sex.','Sáb.'];
const MONTH_ABBR = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

/* ---- Date helpers ---- */
const pad = n => String(n).padStart(2, '0');
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtBR = iso => { if (!iso || iso === '-') return '—'; const d = parseISO(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
const addDaysISO = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d.getFullYear(), d.getMonth(), d.getDate()); };
const startOfWeekISO = iso => { const d = parseISO(iso); d.setDate(d.getDate() - d.getDay()); return toISO(d.getFullYear(), d.getMonth(), d.getDate()); };
const todayISO = () => { const n = new Date(); return toISO(n.getFullYear(), n.getMonth(), n.getDate()); };

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonth = new Date(year, month, 0);
  const daysInPrev = prevMonth.getDate();
  const cells = [];
  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    cells.push({ day: d, iso: toISO(prevMonth.getFullYear(), prevMonth.getMonth(), d), other: true });
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, iso: toISO(year, month, d), other: false });
  const next = new Date(year, month + 1, 1);
  let d = 1;
  while (cells.length < 42) {
    cells.push({ day: d, iso: toISO(next.getFullYear(), next.getMonth(), d), other: true });
    d++;
  }
  return cells;
}

/* ---- Team + Events + Campaigns (from lib/data.ts) ---- */
const TEAM_PROFILES = [
  { id: 'Eduarda', name: 'Eduarda Alves',   role: 'Social Media',       email: 'eduarda.alves@gocase.com', joined: '2024-01-15', color: 'oklch(0.72 0.16 55)',  initial: 'E', isMe: true },
  { id: 'Arno',    name: 'Arno Bertoldi',   role: 'Estrategista',       email: 'arno@gocase.com',          joined: '2023-01-09', color: 'oklch(0.6 0.16 230)',  initial: 'A' },
  { id: 'Pat',     name: 'Patrícia Lima',   role: 'Designer / Editora', email: 'pat@gocase.com',           joined: '2023-04-22', color: 'oklch(0.65 0.16 320)', initial: 'P' },
  { id: 'Lara',    name: 'Lara Mendes',     role: 'Produtora',          email: 'lara@gocase.com',          joined: '2024-02-10', color: 'oklch(0.62 0.15 18)',  initial: 'L' },
  { id: 'Sâmia',   name: 'Sâmia Costa',     role: 'Conteúdo / TikTok', email: 'samia@gocase.com',         joined: '2024-08-05', color: 'oklch(0.62 0.15 150)', initial: 'S' },
];
const TEAM_NAMES = TEAM_PROFILES.map(p => p.id);

const EVENT_TYPES = [
  { id: 'futebol', label: 'Futebol',     color: '#10B981' },
  { id: 'evento',  label: 'Evento',      color: '#6366F1' },
  { id: 'filme',   label: 'Filme/Série', color: '#EC4899' },
];
const FUT_TYPES = [
  { id: 'aniversario', label: 'Aniversário',     color: '#F59E0B' },
  { id: 'brasil',      label: 'Brasil',          color: '#10B981' },
  { id: 'jogo',        label: 'Jogo Importante', color: '#6366F1' },
  { id: 'copa',        label: 'Copa',            color: '#EF4444' },
  { id: 'final',       label: 'Final',           color: '#EC4899' },
  { id: 'premiacao',   label: 'Premiação',       color: '#8B5CF6' },
];
const CAMP_TIPOS = ['Institucional', 'Coleção', 'Produto', 'Data Comemorativa'];

const COMEMORATIVAS = [
  { id:1,  type:'evento',  name:'Dia das Mães',         start:'2026-05-10', end:'2026-05-10', pack:'G',  potencial:true,  postado:true,  format:'Campanha' },
  { id:2,  type:'evento',  name:'Dia dos Namorados',    start:'2026-06-12', end:'2026-06-12', pack:'G',  potencial:true,  postado:false, format:'Campanha' },
  { id:3,  type:'futebol', name:'Copa do Mundo',        start:'2026-06-11', end:'2026-07-19', pack:'G',  potencial:true,  postado:false, format:'Campanha' },
  { id:4,  type:'filme',   name:'Lançamento Avatar 3',  start:'2026-05-22', end:'2026-05-22', pack:'M',  potencial:true,  postado:false, format:'Reels'    },
  { id:5,  type:'evento',  name:'Festa Junina',         start:'2026-06-24', end:'2026-06-24', pack:'M',  potencial:true,  postado:false, format:'Coleção'  },
  { id:6,  type:'filme',   name:'Stranger Things S5',   start:'2026-05-30', end:'2026-05-30', pack:'M',  potencial:true,  postado:false, format:'Estático' },
  { id:7,  type:'evento',  name:'Dia da Mulher',        start:'2026-03-08', end:'2026-03-08', pack:'G',  potencial:true,  postado:true,  format:'Campanha' },
  { id:8,  type:'evento',  name:'Páscoa',               start:'2026-04-05', end:'2026-04-05', pack:'M',  potencial:true,  postado:true,  format:'Estático' },
  { id:9,  type:'futebol', name:'Libertadores Final',   start:'2026-11-28', end:'2026-11-28', pack:'P',  potencial:false, postado:false, format:'Story'    },
  { id:10, type:'filme',   name:'Wicked Part 2',        start:'2026-11-21', end:'2026-11-21', pack:'P',  potencial:true,  postado:false, format:'Story'    },
  { id:11, type:'evento',  name:'Black Friday',         start:'2026-11-27', end:'2026-11-27', pack:'G',  potencial:true,  postado:false, format:'Campanha' },
  { id:12, type:'evento',  name:'Dia dos Pais',         start:'2026-08-09', end:'2026-08-09', pack:'G',  potencial:true,  postado:false, format:'Campanha' },
  { id:13, type:'filme',   name:'Mission Impossible 8', start:'2026-05-15', end:'2026-05-15', pack:'P',  potencial:false, postado:false, format:'Story'    },
  { id:14, type:'evento',  name:'Volta às aulas',       start:'2026-02-01', end:'2026-02-15', pack:'G',  potencial:true,  postado:true,  format:'Campanha' },
];
const FUTEBOL_2026 = [
  { id:1,  type:'copa',        name:'Abertura Copa do Mundo',     date:'2026-06-11' },
  { id:2,  type:'brasil',      name:'Brasil x Sérvia (Estreia)',  date:'2026-06-15' },
  { id:3,  type:'jogo',        name:'Argentina x França',         date:'2026-06-18' },
  { id:4,  type:'brasil',      name:'Brasil x Camarões',          date:'2026-06-20' },
  { id:5,  type:'brasil',      name:'Brasil x Suíça',             date:'2026-06-25' },
  { id:6,  type:'jogo',        name:'Oitavas - confronto Brasil', date:'2026-07-01' },
  { id:7,  type:'final',       name:'Final Copa do Mundo',        date:'2026-07-19' },
  { id:8,  type:'final',       name:'Final Champions League',     date:'2026-05-30' },
  { id:9,  type:'final',       name:'Final Libertadores',         date:'2026-11-28' },
  { id:10, type:'premiacao',   name:'Bola de Ouro 2026',          date:'2026-10-26' },
  { id:11, type:'aniversario', name:'Aniversário Pelé',           date:'2026-10-23' },
  { id:12, type:'aniversario', name:'Aniversário Neymar',         date:'2026-02-05' },
  { id:13, type:'aniversario', name:'Aniversário Messi',          date:'2026-06-24' },
  { id:14, type:'jogo',        name:'Brasileirão - Fla x Flu',    date:'2026-05-17' },
  { id:15, type:'jogo',        name:'Brasileirão - Clássico',     date:'2026-05-24' },
  { id:16, type:'copa',        name:'Sorteio Grupos Copa',        date:'2026-04-05' },
];
const CAMPAIGNS_LIST = [
  { id:1, slug:'care',      nome:'Linha Care - Lançamento Verão', pack:'G', dono:'Lara',     tipo:'Coleção',          mes:'Maio',    dataInsta:'2026-05-13', dataSite:'2026-05-15', dataComercial:'2026-05-10', dataFinal:'2026-06-15', previsao:'2026-05-13', launched:false, progresso:75, colecaoId: 9,
    brainstormDate:'2026-04-22', brainstormDone:true, aprovComercialDate:'2026-05-06', aprovComercialDone:false, shootingDate:'2026-04-29', shootingDone:true },
  { id:2, slug:'copa',      nome:'Copa 2026',                     pack:'G', dono:'Arno',     tipo:'Data Comemorativa',mes:'Junho',   dataInsta:'2026-06-10', dataSite:'2026-06-08', dataComercial:'2026-06-05', dataFinal:'2026-07-20', previsao:'2026-06-11', launched:false, progresso:40,
    brainstormDate:'2026-05-20', brainstormDone:true, aprovComercialDate:'2026-06-03', aprovComercialDone:false, shootingDate:'2026-05-27', shootingDone:false },
  { id:3, slug:'namorados', nome:'Dia dos Namorados',             pack:'M', dono:'Pat',      tipo:'Data Comemorativa',mes:'Junho',   dataInsta:'2026-06-05', dataSite:'2026-06-01', dataComercial:'2026-05-28', dataFinal:'2026-06-12', previsao:'2026-06-12', launched:false, progresso:60,
    brainstormDate:'2026-05-15', brainstormDone:true, aprovComercialDate:'2026-05-29', aprovComercialDone:true, shootingDate:'2026-05-22', shootingDone:false },
  { id:4, slug:'asmr-col',  nome:'Coleção Asmr',                  pack:'P', dono:'Sâmia',    tipo:'Coleção',          mes:'Maio',    dataInsta:'2026-05-20', dataSite:'2026-05-22', dataComercial:'2026-05-18', dataFinal:'2026-06-30', previsao:'2026-05-20', launched:false, progresso:25,
    brainstormDate:'2026-04-29', brainstormDone:true, aprovComercialDate:'2026-05-13', aprovComercialDone:false, shootingDate:'2026-05-06', shootingDone:false },
  { id:5, slug:'hometour',  nome:'Branding - Hometour',           pack:'P', dono:'Eduarda',  tipo:'Institucional',    mes:'Maio',    dataInsta:'2026-05-28', dataSite:'-',          dataComercial:'-',          dataFinal:'2026-06-05', previsao:'2026-05-28', launched:false, progresso:85,
    brainstormDate:'2026-05-07', brainstormDone:true, aprovComercialDate:'2026-05-21', aprovComercialDone:true, shootingDate:'2026-05-14', shootingDone:true },
  { id:6, slug:'maes',      nome:'Dia das Mães',                  pack:'G', dono:'Lara',     tipo:'Data Comemorativa',mes:'Maio',    dataInsta:'2026-05-10', dataSite:'2026-05-05', dataComercial:'2026-05-01', dataFinal:'2026-05-12', previsao:'2026-05-10', launched:true,  progresso:100,
    brainstormDate:'2026-04-19', brainstormDone:true, aprovComercialDate:'2026-05-03', aprovComercialDone:true, shootingDate:'2026-04-26', shootingDone:true },
  { id:7, slug:'carteira',  nome:'Produto Hero - Carteira',       pack:'M', dono:'Pat',      tipo:'Produto',          mes:'Julho',   dataInsta:'2026-07-08', dataSite:'2026-07-10', dataComercial:'2026-07-05', dataFinal:'2026-08-10', previsao:'2026-07-08', launched:false, progresso:10,
    brainstormDate:'2026-06-17', brainstormDone:false, aprovComercialDate:'2026-07-01', aprovComercialDone:false, shootingDate:'2026-06-24', shootingDone:false },
  { id:8, slug:'pele',      nome:'Pelé Forever',                  pack:'P', dono:'Arno',     tipo:'Institucional',    mes:'Outubro', dataInsta:'2026-10-23', dataSite:'-',          dataComercial:'-',          dataFinal:'2026-10-30', previsao:'2026-10-23', launched:false, progresso:5,
    brainstormDate:'2026-10-02', brainstormDone:false, aprovComercialDate:'2026-10-16', aprovComercialDone:false, shootingDate:'2026-10-09', shootingDone:false },
];

/* ---- Pacotes de Campanhas (referência) ---- */
const PACKAGE_INFO = [
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
];

const FORMATS_LIST = ['Story', 'Estático', 'Coleção', 'Reels', 'Campanha'];

/* ============ COLEÇÕES ============ */
const COLECAO_TIPOS = [
  { id: 'licenciamento', label: 'Licenciamento', color: 'oklch(0.55 0.13 285)' },
  { id: 'autoral',       label: 'Autoral',       color: 'oklch(0.55 0.13 165)' },
  { id: 'sustentacao',   label: 'Sustentação',   color: 'oklch(0.55 0.13 230)' },
  { id: 'artista',       label: 'Artista',       color: 'oklch(0.55 0.13 25)'  },
];

const COL_STATUS = [
  { id: 'naoIniciada', label: 'Não iniciada', color: 'oklch(0.62 0.012 300)' },
  { id: 'criacao',     label: 'Em criação',   color: 'oklch(0.6 0.13 265)'  },
  { id: 'aprovacao',   label: 'Aprovação',    color: 'oklch(0.62 0.13 75)'  },
  { id: 'atrasada',    label: 'Atrasada',     color: 'oklch(0.55 0.18 25)'  },
];

const COL_CONFIRMADO = [
  { id: 'ok',         label: 'Confirmada',    color: 'oklch(0.6 0.13 150)' },
  { id: 'negociacao', label: 'Em negociação', color: 'oklch(0.62 0.13 75)' },
  { id: 'cancelada',  label: 'Cancelada',     color: 'oklch(0.6 0.05 25)'  },
];

/* Task descriptors — used to build progress + UI from a single source of truth */
const ILUSTRA_TASKS = [
  { key: 'criacao',   label: 'Criação das estampas',    optional: false },
  { key: 'adaptacao', label: 'Adaptação',                optional: false },
  { key: 'aprov',     label: 'Aprovação das estampas',   optional: true  },
  { key: 'cadastro',  label: 'Cadastro',                 optional: false },
];
const MKT_TASKS = [
  { key: 'banner',    label: 'Banner',              optional: false },
  { key: 'pedido',    label: 'Pedido de conteúdo',  optional: true  },
  { key: 'loading',   label: 'Loading page',        optional: true  },
  { key: 'post',      label: 'Post estático',       optional: true  },
  { key: 'carrossel', label: 'Carrossel',           optional: true  },
  { key: 'reels',     label: 'Reels',               optional: true  },
  { key: 'trinca',    label: 'Trinca de conteúdo', optional: true  },
  { key: 'shooting',  label: 'Mini shooting',       optional: true  },
  { key: 'stories',   label: 'Stories',             optional: true  },
  { key: 'influs',    label: 'Influs',              optional: true  },
];

function colProgress(c) {
  let total = 0, done = 0;
  ILUSTRA_TASKS.forEach(t => {
    const enabled = t.optional ? !!c.ilustra[`${t.key}Enabled`] : true;
    if (enabled) { total++; if (c.ilustra[t.key]) done++; }
  });
  MKT_TASKS.forEach(t => {
    const enabled = t.optional ? !!c.marketing[`${t.key}Enabled`] : true;
    if (enabled) { total++; if (c.marketing[t.key]) done++; }
  });
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

const COLLECTIONS_LIST = [
  {
    id: 1, nome: 'Disney 100 — Princesas', tipo: 'licenciamento',
    mes: 'Maio', dataSite: '2026-05-22', dataMarketing: '2026-05-08',
    confirmado: 'ok', launched: false,
    ilustra: { status: 'criacao', criacao: true, adaptacao: true, aprovEnabled: true, aprov: false, cadastro: false },
    marketing: { status: 'criacao', pack: 'G', dono: 'Lara',
      banner: true,
      pedidoEnabled: true, pedido: true,
      loadingEnabled: true, loading: false,
      postEnabled: true, post: true,
      carrosselEnabled: true, carrossel: false,
      reelsEnabled: true, reels: false,
      trincaEnabled: false, trinca: false,
      shootingEnabled: true, shooting: true,
      storiesEnabled: true, stories: false,
      influsEnabled: true, influs: false },
  },
  {
    id: 2, nome: 'Floral Autoral — Verão', tipo: 'autoral',
    mes: 'Junho', dataSite: '2026-06-10', dataMarketing: '2026-05-28',
    confirmado: 'ok', launched: false,
    ilustra: { status: 'aprovacao', criacao: true, adaptacao: true, aprovEnabled: true, aprov: true, cadastro: false },
    marketing: { status: 'criacao', pack: 'M', dono: 'Pat',
      banner: true,
      pedidoEnabled: false, pedido: false,
      loadingEnabled: false, loading: false,
      postEnabled: true, post: true,
      carrosselEnabled: true, carrossel: true,
      reelsEnabled: true, reels: false,
      trincaEnabled: false, trinca: false,
      shootingEnabled: false, shooting: false,
      storiesEnabled: true, stories: false,
      influsEnabled: false, influs: false },
  },
  {
    id: 3, nome: 'Linha Liso Premium', tipo: 'sustentacao',
    mes: 'Maio', dataSite: '2026-05-05', dataMarketing: '2026-04-22',
    confirmado: 'ok', launched: true,
    ilustra: { status: 'criacao', criacao: true, adaptacao: true, aprovEnabled: false, aprov: false, cadastro: true },
    marketing: { status: 'criacao', pack: 'P', dono: 'Eduarda',
      banner: true,
      pedidoEnabled: false, pedido: false,
      loadingEnabled: false, loading: false,
      postEnabled: true, post: true,
      carrosselEnabled: false, carrossel: false,
      reelsEnabled: true, reels: true,
      trincaEnabled: false, trinca: false,
      shootingEnabled: false, shooting: false,
      storiesEnabled: true, stories: true,
      influsEnabled: false, influs: false },
  },
  {
    id: 4, nome: 'Mariana Bassi × Gocase', tipo: 'artista',
    mes: 'Julho', dataSite: '2026-07-15', dataMarketing: '2026-06-30',
    confirmado: 'negociacao', launched: false,
    ilustra: { status: 'naoIniciada', criacao: false, adaptacao: false, aprovEnabled: true, aprov: false, cadastro: false },
    marketing: { status: 'naoIniciada', pack: 'M', dono: 'Arno',
      banner: false,
      pedidoEnabled: true, pedido: false,
      loadingEnabled: true, loading: false,
      postEnabled: true, post: false,
      carrosselEnabled: true, carrossel: false,
      reelsEnabled: true, reels: false,
      trincaEnabled: true, trinca: false,
      shootingEnabled: true, shooting: false,
      storiesEnabled: true, stories: false,
      influsEnabled: true, influs: false },
  },
  {
    id: 5, nome: 'Marvel Spider-Verse', tipo: 'licenciamento',
    mes: 'Agosto', dataSite: '2026-08-14', dataMarketing: '2026-07-25',
    confirmado: 'negociacao', launched: false,
    ilustra: { status: 'naoIniciada', criacao: false, adaptacao: false, aprovEnabled: true, aprov: false, cadastro: false },
    marketing: { status: 'naoIniciada', pack: 'G', dono: 'Lara',
      banner: false,
      pedidoEnabled: true, pedido: false,
      loadingEnabled: true, loading: false,
      postEnabled: true, post: false,
      carrosselEnabled: true, carrossel: false,
      reelsEnabled: true, reels: false,
      trincaEnabled: true, trinca: false,
      shootingEnabled: true, shooting: false,
      storiesEnabled: true, stories: false,
      influsEnabled: true, influs: false },
  },
  {
    id: 6, nome: 'Geométrico Verão', tipo: 'autoral',
    mes: 'Junho', dataSite: '2026-06-20', dataMarketing: '2026-06-05',
    confirmado: 'ok', launched: false,
    ilustra: { status: 'atrasada', criacao: true, adaptacao: false, aprovEnabled: false, aprov: false, cadastro: false },
    marketing: { status: 'naoIniciada', pack: 'P', dono: 'Sâmia',
      banner: false,
      pedidoEnabled: false, pedido: false,
      loadingEnabled: false, loading: false,
      postEnabled: true, post: false,
      carrosselEnabled: false, carrossel: false,
      reelsEnabled: true, reels: false,
      trincaEnabled: false, trinca: false,
      shootingEnabled: false, shooting: false,
      storiesEnabled: true, stories: false,
      influsEnabled: false, influs: false },
  },
  {
    id: 7, nome: 'Tampas Pastel', tipo: 'sustentacao',
    mes: 'Abril', dataSite: '2026-04-18', dataMarketing: '2026-04-05',
    confirmado: 'ok', launched: true,
    ilustra: { status: 'criacao', criacao: true, adaptacao: true, aprovEnabled: false, aprov: false, cadastro: true },
    marketing: { status: 'criacao', pack: 'PP', dono: 'Pat',
      banner: true,
      pedidoEnabled: false, pedido: false,
      loadingEnabled: false, loading: false,
      postEnabled: true, post: true,
      carrosselEnabled: false, carrossel: false,
      reelsEnabled: false, reels: false,
      trincaEnabled: false, trinca: false,
      shootingEnabled: false, shooting: false,
      storiesEnabled: true, stories: true,
      influsEnabled: false, influs: false },
  },
  {
    id: 8, nome: 'BTS Collection 2026', tipo: 'licenciamento',
    mes: 'Setembro', dataSite: '2026-09-12', dataMarketing: '2026-08-28',
    confirmado: 'cancelada', launched: false,
    ilustra: { status: 'naoIniciada', criacao: false, adaptacao: false, aprovEnabled: true, aprov: false, cadastro: false },
    marketing: { status: 'naoIniciada', pack: 'G', dono: 'Lara',
      banner: false,
      pedidoEnabled: true, pedido: false,
      loadingEnabled: true, loading: false,
      postEnabled: true, post: false,
      carrosselEnabled: true, carrossel: false,
      reelsEnabled: true, reels: false,
      trincaEnabled: true, trinca: false,
      shootingEnabled: true, shooting: false,
      storiesEnabled: true, stories: false,
      influsEnabled: true, influs: false },
  },
  {
    id: 9, nome: 'Linha Care — Verão', tipo: 'sustentacao',
    mes: 'Maio', dataSite: '2026-05-15', dataMarketing: '2026-05-01',
    confirmado: 'ok', launched: false, campaignId: 1,
    ilustra: { status: 'criacao', criacao: true, adaptacao: true, aprovEnabled: false, aprov: false, cadastro: false },
    marketing: { status: 'criacao', pack: 'G', dono: 'Lara',
      banner: true,
      pedidoEnabled: true, pedido: true,
      loadingEnabled: true, loading: true,
      postEnabled: true, post: true,
      carrosselEnabled: true, carrossel: true,
      reelsEnabled: true, reels: false,
      trincaEnabled: false, trinca: false,
      shootingEnabled: true, shooting: true,
      storiesEnabled: true, stories: false,
      influsEnabled: true, influs: false },
  },
];

/* ---- Mock posts seeded into current month for realism ---- */
const MOCK_TITLES = [
  ['ig',      'Unboxing Linha Care verão',     'Eduarda', 'Reels',    ['branding'], 'produtos',  null,         3],
  ['ig',      'Behind the scenes ASMR',         'Sâmia',   'Reels',    ['mh'],       'asmr',      null,         4],
  ['tiktok',  'Trend dos tampers',              'Sâmia',   'Vídeo',    ['mh'],       'trends',    null,         2],
  ['ig',      'Carrossel - novas estampas',     'Pat',     'Carrossel',[],           'produtos',  'care',       3],
  ['canal',   'YouTube short: review carteira', 'Lara',    'Vídeo',    ['mh'],       'produtos',  'carteira',   4],
  ['ig',      'Story enquete cor favorita',     'Eduarda', 'Story',    ['branding'], 'escritorio',null,         1],
  ['twitter', 'Thread copa do mundo',           'Arno',    'Texto',    ['futebol'],  'trends',    'copa',       2],
  ['ig',      'Reels lançamento Care',          'Lara',    'Reels',    ['campanha'], 'produtos',  'care',       5],
  ['tiktok',  'POV: chegou caixa Gocase',       'Sâmia',   'Vídeo',    ['mh'],       'trends',    null,         3],
  ['ig',      'Imagem hero produto novo',       'Pat',     'Imagem',   [],           'produtos',  null,         2],
  ['canal',   'Hometour escritório novo',       'Eduarda', 'Vídeo',    ['branding'], 'escritorio','hometour',   4],
  ['ig',      'Dia das Mães - vídeo emotivo',   'Lara',    'Reels',    ['campanha'], 'produtos',  'maes',       5],
  ['ig',      'Carrossel referências moodboard','Pat',     'Carrossel',['branding'], 'trends',    null,         3],
  ['tiktok',  'Reagindo aos comentários',       'Sâmia',   'Vídeo',    [],           'trends',    null,         2],
  ['twitter', 'Tweet sobre lançamento',         'Arno',    'Texto',    [],           'ads',       'care',       1],
  ['ig',      'Story bastidores ensaio',        'Eduarda', 'Story',    [],           'produtos',  null,         1],
  ['ig',      'Reels ASMR aplicando capa',      'Sâmia',   'Reels',    ['mh','branding'], 'asmr', null,         4],
  ['canal',   'Tutorial cuidado da capa',       'Lara',    'Vídeo',    [],           'produtos',  null,         3],
  ['ig',      'Carrossel time Gocase',          'Eduarda', 'Carrossel',['branding'], 'escritorio',null,         2],
  ['ig',      'Reels Brasil x Sérvia hype',     'Pat',     'Reels',    ['futebol','campanha'], 'trends', 'copa', 4],
  ['tiktok',  'Trend Festa Junina',             'Sâmia',   'Vídeo',    [],           'trends',    null,         3],
  ['ig',      'Story countdown Namorados',      'Pat',     'Story',    ['campanha'], 'produtos',  'namorados',  2],
  ['ig',      'Reels Dia dos Namorados pré',    'Lara',    'Reels',    ['campanha'], 'produtos',  'namorados',  4],
  ['canal',   'Vídeo presente perfeito',        'Lara',    'Vídeo',    ['campanha'], 'produtos',  'namorados',  3],
  ['twitter', 'Tweet meme namorados',           'Arno',    'Texto',    [],           'trends',    'namorados',  1],
  ['ig',      'Reels review semanal',           'Eduarda', 'Reels',    ['mh'],       'produtos',  null,         3],
  ['ig',      'Imagem produto hero',            'Pat',     'Imagem',   ['branding'], 'produtos',  null,         2],
  ['tiktok',  'TikTok dancinha pacote',         'Sâmia',   'Vídeo',    ['mh'],       'trends',    null,         3],
];

function genMockPosts() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const posts = [];
  let id = 1;
  MOCK_TITLES.forEach((row, i) => {
    const [platform, title, owner, type, tags, linha, campanha, complexity] = row;
    // spread across this month + a bit of next
    const dayOffset = (i * 2 + (i % 3)) % (daysInMonth + 5);
    const day = 1 + dayOffset;
    let d, m = month, y = year;
    if (day > daysInMonth) {
      d = day - daysInMonth;
      m = month + 1;
      if (m > 11) { m = 0; y = year + 1; }
    } else { d = day; }
    const dateISO = toISO(y, m, d);
    const hour = 8 + ((i * 3) % 13);
    const minute = (i * 17) % 60;
    const time = `${pad(hour)}:${pad(minute)}`;
    // status based on whether date is past/present/future
    const isPast = (y < year) || (y === year && m < month) || (y === year && m === month && d < today);
    const isToday = (y === year && m === month && d === today);
    let status;
    if (isPast) status = i % 7 === 0 ? 'cancel' : 'pub';
    else if (isToday) status = i % 3 === 0 ? 'sched' : 'prod';
    else status = (i % 4 === 0) ? 'sched' : 'prod';
    posts.push({
      id: id++, title, owner, platform, date: dateISO, time, status,
      complexity, type, tags, linha, campanha, link: '', ref: '', notes: '',
    });
  });
  return posts;
}

const INITIAL_POSTS = genMockPosts();

Object.assign(window, {
  PLATFORMS, STATUSES, TAGS, LINHAS_ED, CAMP_LIST,
  CONTENT_TYPES_IG, CONTENT_TYPES_OTHER,
  MONTHS, WEEKDAYS, WEEKDAYS_FULL, MONTH_ABBR,
  pad, toISO, parseISO, fmtBR, addDaysISO, startOfWeekISO, todayISO, buildMonthGrid,
  TEAM_PROFILES, TEAM_NAMES, EVENT_TYPES, FUT_TYPES, CAMP_TIPOS,
  COMEMORATIVAS, FUTEBOL_2026, CAMPAIGNS_LIST,
  PACKAGE_INFO, FORMATS_LIST,
  COLECAO_TIPOS, COL_STATUS, COL_CONFIRMADO,
  ILUSTRA_TASKS, MKT_TASKS, colProgress, COLLECTIONS_LIST,
  INITIAL_POSTS,
});
