import type { Campaign, EventDate, FutebolEvent, TeamProfile } from './types'

export const TEAM_PROFILES: TeamProfile[] = [
  { id: 'Eduarda', name: 'Eduarda Alves',   role: 'Social Media',       email: 'eduarda.alves@gocase.com', joined: '2024-01-15', color: 'oklch(0.72 0.16 55)',  initial: 'E', isMe: true },
  { id: 'Arno',    name: 'Arno Bertoldi',   role: 'Estrategista',       email: 'arno@gocase.com',          joined: '2023-01-09', color: 'oklch(0.6 0.16 230)',  initial: 'A' },
  { id: 'Pat',     name: 'Patrícia Lima',   role: 'Designer / Editora', email: 'pat@gocase.com',           joined: '2023-04-22', color: 'oklch(0.65 0.16 320)', initial: 'P' },
  { id: 'Lara',    name: 'Lara Mendes',     role: 'Produtora',          email: 'lara@gocase.com',          joined: '2024-02-10', color: 'oklch(0.62 0.15 18)',  initial: 'L' },
  { id: 'Sâmia',   name: 'Sâmia Costa',     role: 'Conteúdo / TikTok', email: 'samia@gocase.com',         joined: '2024-08-05', color: 'oklch(0.62 0.15 150)', initial: 'S' },
]

export const TEAM_NAMES = TEAM_PROFILES.map(p => p.id)

export const EVENT_TYPES = [
  { id: 'futebol', label: 'Futebol',     color: '#10B981' },
  { id: 'evento',  label: 'Evento',      color: '#6366F1' },
  { id: 'filme',   label: 'Filme/Série', color: '#EC4899' },
]

export const FUT_TYPES = [
  { id: 'aniversario', label: 'Aniversário',     color: '#F59E0B' },
  { id: 'brasil',      label: 'Brasil',          color: '#10B981' },
  { id: 'jogo',        label: 'Jogo Importante', color: '#6366F1' },
  { id: 'copa',        label: 'Copa',            color: '#EF4444' },
  { id: 'final',       label: 'Final',           color: '#EC4899' },
  { id: 'premiacao',   label: 'Premiação',       color: '#8B5CF6' },
]

export const PACKAGES = ['PP', 'P', 'M', 'G'] as const
export const FORMATS = ['Story', 'Estático', 'Coleção', 'Reels', 'Campanha']
export const CAMP_TIPOS = ['Institucional', 'Coleção', 'Produto', 'Data Comemorativa']

export const COMEMORATIVAS: EventDate[] = [
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
]

export const FUTEBOL_2026: FutebolEvent[] = [
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
]

export const CAMPAIGNS_LIST: Campaign[] = [
  { id:1, slug:'care',      nome:'Linha Care - Lançamento Verão', pack:'G', dono:'Lara',     tipo:'Coleção',          mes:'Maio',    dataInsta:'2026-05-13', dataSite:'2026-05-15', dataComercial:'2026-05-10', dataFinal:'2026-06-15', previsao:'2026-05-13', launched:false, progresso:75 },
  { id:2, slug:'copa',      nome:'Copa 2026',                     pack:'G', dono:'Arno',     tipo:'Data Comemorativa',mes:'Junho',   dataInsta:'2026-06-10', dataSite:'2026-06-08', dataComercial:'2026-06-05', dataFinal:'2026-07-20', previsao:'2026-06-11', launched:false, progresso:40 },
  { id:3, slug:'namorados', nome:'Dia dos Namorados',             pack:'M', dono:'Pat',      tipo:'Data Comemorativa',mes:'Junho',   dataInsta:'2026-06-05', dataSite:'2026-06-01', dataComercial:'2026-05-28', dataFinal:'2026-06-12', previsao:'2026-06-12', launched:false, progresso:60 },
  { id:4, slug:'asmr-col',  nome:'Coleção Asmr',                  pack:'P', dono:'Sâmia',    tipo:'Coleção',          mes:'Maio',    dataInsta:'2026-05-20', dataSite:'2026-05-22', dataComercial:'2026-05-18', dataFinal:'2026-06-30', previsao:'2026-05-20', launched:false, progresso:25 },
  { id:5, slug:'hometour',  nome:'Branding - Hometour',           pack:'P', dono:'Eduarda',  tipo:'Institucional',    mes:'Maio',    dataInsta:'2026-05-28', dataSite:'-',          dataComercial:'-',          dataFinal:'2026-06-05', previsao:'2026-05-28', launched:false, progresso:85 },
  { id:6, slug:'maes',      nome:'Dia das Mães',                  pack:'G', dono:'Lara',     tipo:'Data Comemorativa',mes:'Maio',    dataInsta:'2026-05-10', dataSite:'2026-05-05', dataComercial:'2026-05-01', dataFinal:'2026-05-12', previsao:'2026-05-10', launched:true,  progresso:100 },
  { id:7, slug:'carteira',  nome:'Produto Hero - Carteira',       pack:'M', dono:'Pat',      tipo:'Produto',          mes:'Julho',   dataInsta:'2026-07-08', dataSite:'2026-07-10', dataComercial:'2026-07-05', dataFinal:'2026-08-10', previsao:'2026-07-08', launched:false, progresso:10 },
  { id:8, slug:'pele',      nome:'Pelé Forever',                  pack:'P', dono:'Arno',     tipo:'Institucional',    mes:'Outubro', dataInsta:'2026-10-23', dataSite:'-',          dataComercial:'-',          dataFinal:'2026-10-30', previsao:'2026-10-23', launched:false, progresso:5  },
]
