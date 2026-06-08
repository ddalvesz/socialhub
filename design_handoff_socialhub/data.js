// ============ MOCK DATA ============
// Today: 13 May 2026

const TEAM = ["Arno", "Lu", "Pat", "Lara", "Sâmia"];

const TEAM_PROFILES = [
  { id: "Lu",    name: "Lu Reis",         role: "Social Lead",       email: "lu@gocase.com",      joined: "2022-03-14", color: "oklch(0.72 0.16 55)",  initial: "L", isMe: true },
  { id: "Arno",  name: "Arno Bertoldi",   role: "Estrategista",      email: "arno@gocase.com",    joined: "2023-01-09", color: "oklch(0.6 0.16 230)",  initial: "A" },
  { id: "Pat",   name: "Patrícia Lima",   role: "Designer / Editora",email: "pat@gocase.com",     joined: "2023-04-22", color: "oklch(0.65 0.16 320)", initial: "P" },
  { id: "Lara",  name: "Lara Mendes",     role: "Produtora",         email: "lara@gocase.com",    joined: "2024-02-10", color: "oklch(0.62 0.15 18)",  initial: "L" },
  { id: "Sâmia", name: "Sâmia Costa",     role: "Conteúdo / TikTok", email: "samia@gocase.com",   joined: "2024-08-05", color: "oklch(0.62 0.15 150)", initial: "S" },
];

const PLATFORMS = [
  { id: "ig",     label: "Instagram", color: "#E1306C", gradient: "linear-gradient(135deg,#F77737 0%,#E1306C 50%,#833AB4 100%)" },
  { id: "tiktok", label: "TikTok",    color: "#111111", gradient: "linear-gradient(135deg,#25F4EE 0%,#111 40%,#FE2C55 100%)" },
  { id: "canal",  label: "Canal",     color: "#FF0033", gradient: "linear-gradient(135deg,#FF4060 0%,#FF0033 100%)" },
  { id: "twitter",label: "Twitter",   color: "#111111", gradient: "linear-gradient(135deg,#1DA1F2 0%,#111 100%)" },
];

const STATUSES = [
  { id: "prod",   label: "Em produção", className: "s-prod"  },
  { id: "sched",  label: "Agendado",    className: "s-sched" },
  { id: "pub",    label: "Publicado",   className: "s-pub"   },
  { id: "cancel", label: "Cancelado",   className: "s-cancel"},
];

const TAGS = [
  { id:"campanha", label:"Campanha" },
  { id:"branding", label:"Branding" },
  { id:"mh",       label:"MH" },
  { id:"futebol",  label:"Futebol" },
];

const LINHAS_ED = [
  { id:"escritorio", label:"Escritório" },
  { id:"produtos",   label:"Produtos" },
  { id:"trends",     label:"Trends" },
  { id:"asmr",       label:"ASMR" },
  { id:"ads",        label:"Ads" },
];

const CAMPANHAS = [
  { id:"copa",       label:"Copa 2026" },
  { id:"care",       label:"Linha Care" },
  { id:"namorados",  label:"Dia dos Namorados" },
  { id:"maes",       label:"Dia das Mães" },
];

const CONTENT_TYPES_IG = ["Reels", "Carrossel", "Imagem", "Story"];
const CONTENT_TYPES_OTHER = ["Vídeo", "Imagem", "Texto"];

// Posts for May 2026
const POSTS = [
  { id:1,  title:"Reels desk setup minimalista",   owner:"Lu",    platform:"ig",     date:"2026-05-04", time:"10:00", status:"pub",   complexity:3, type:"Reels",     tags:["mh"],            linha:"escritorio", campanha:null,        link:"", ref:"https://figma.com/ref", notes:"Foco no produto, luz natural" },
  { id:2,  title:"Carrossel: 5 dicas de organização", owner:"Pat",platform:"ig",     date:"2026-05-05", time:"15:30", status:"pub",   complexity:2, type:"Carrossel", tags:["branding"],      linha:"produtos",   campanha:null,        link:"", ref:"", notes:"" },
  { id:3,  title:"TikTok trend ASMR caderno",      owner:"Sâmia", platform:"tiktok", date:"2026-05-06", time:"19:00", status:"pub",   complexity:4, type:"Vídeo",     tags:["mh"],            linha:"asmr",       campanha:null,        link:"", ref:"", notes:"Trend do som de canetinha" },
  { id:4,  title:"Tweet copa Brasil x Argentina",  owner:"Arno",  platform:"twitter",date:"2026-05-07", time:"21:45", status:"pub",   complexity:1, type:"Texto",     tags:["futebol","campanha"], linha:"trends", campanha:"copa", link:"", ref:"", notes:"" },
  { id:5,  title:"Vídeo YouTube unboxing Care",    owner:"Lara",  platform:"canal",  date:"2026-05-08", time:"12:00", status:"pub",   complexity:5, type:"Vídeo",     tags:["branding","campanha"], linha:"produtos", campanha:"care", link:"https://youtu.be/x", ref:"", notes:"" },
  { id:6,  title:"Story bastidores fotos",         owner:"Lu",    platform:"ig",     date:"2026-05-11", time:"11:00", status:"pub",   complexity:1, type:"Story",     tags:[],                linha:"escritorio", campanha:null,        link:"", ref:"", notes:"" },

  { id:7,  title:"Reels lançamento Linha Care",    owner:"Pat",   platform:"ig",     date:"2026-05-13", time:"17:00", status:"sched", complexity:5, type:"Reels",     tags:["campanha","branding"], linha:"produtos", campanha:"care", link:"", ref:"https://drive.google.com/care", notes:"Hero reels, edição cinematográfica" },
  { id:8,  title:"TikTok ASMR papelaria",          owner:"Sâmia", platform:"tiktok", date:"2026-05-13", time:"20:00", status:"sched", complexity:3, type:"Vídeo",     tags:["mh"],            linha:"asmr",       campanha:null,        link:"", ref:"", notes:"" },
  { id:9,  title:"Tweet meme escritório segunda", owner:"Arno",   platform:"twitter",date:"2026-05-13", time:"09:00", status:"pub",   complexity:1, type:"Texto",     tags:["branding"],      linha:"trends",     campanha:null,        link:"", ref:"", notes:"" },

  { id:10, title:"Carrossel Día das Mães",        owner:"Lara",   platform:"ig",     date:"2026-05-12", time:"08:30", status:"pub",   complexity:3, type:"Carrossel", tags:["campanha","branding"], linha:"produtos", campanha:"maes", link:"", ref:"", notes:"" },
  { id:11, title:"YouTube short: bastidores",     owner:"Lu",     platform:"canal",  date:"2026-05-14", time:"18:00", status:"prod",  complexity:2, type:"Vídeo",     tags:["mh"],            linha:"escritorio", campanha:null,        link:"", ref:"", notes:"" },
  { id:12, title:"Reels trend pega corona",       owner:"Sâmia",  platform:"ig",     date:"2026-05-15", time:"19:30", status:"prod",  complexity:4, type:"Reels",     tags:["mh","futebol"],  linha:"trends",     campanha:"copa",      link:"", ref:"", notes:"" },
  { id:13, title:"Story enquete copa",            owner:"Arno",   platform:"ig",     date:"2026-05-15", time:"22:00", status:"sched", complexity:1, type:"Story",     tags:["futebol","campanha"], linha:"ads", campanha:"copa", link:"", ref:"", notes:"" },

  { id:14, title:"Carrossel produtos novos",      owner:"Pat",    platform:"ig",     date:"2026-05-18", time:"10:00", status:"prod",  complexity:3, type:"Carrossel", tags:["branding"],      linha:"produtos",   campanha:null,        link:"", ref:"", notes:"" },
  { id:15, title:"TikTok desafio carimbo",        owner:"Sâmia",  platform:"tiktok", date:"2026-05-19", time:"20:00", status:"prod",  complexity:3, type:"Vídeo",     tags:["mh"],            linha:"trends",     campanha:null,        link:"", ref:"", notes:"" },
  { id:16, title:"YouTube vlog viagem São Paulo", owner:"Lara",   platform:"canal",  date:"2026-05-21", time:"15:00", status:"prod",  complexity:5, type:"Vídeo",     tags:["branding"],      linha:"escritorio", campanha:null,        link:"", ref:"", notes:"" },
  { id:17, title:"Reels esquenta Copa",           owner:"Lu",     platform:"ig",     date:"2026-05-22", time:"19:00", status:"prod",  complexity:4, type:"Reels",     tags:["futebol","campanha"], linha:"ads", campanha:"copa", link:"", ref:"", notes:"" },

  { id:18, title:"Story bts fotos copa",          owner:"Arno",   platform:"ig",     date:"2026-05-25", time:"12:00", status:"prod",  complexity:1, type:"Story",     tags:["futebol","campanha"], linha:"escritorio", campanha:"copa", link:"", ref:"", notes:"" },
  { id:19, title:"Tweet final Champions",         owner:"Arno",   platform:"twitter",date:"2026-05-30", time:"17:00", status:"prod",  complexity:1, type:"Texto",     tags:["futebol"],       linha:"trends",     campanha:null,        link:"", ref:"", notes:"" },
  { id:20, title:"Reels ASMR colagem",            owner:"Sâmia",  platform:"ig",     date:"2026-05-27", time:"19:00", status:"prod",  complexity:3, type:"Reels",     tags:["mh"],            linha:"asmr",       campanha:null,        link:"", ref:"", notes:"" },
  { id:21, title:"Carrossel review semanal",      owner:"Pat",    platform:"ig",     date:"2026-05-29", time:"16:00", status:"sched", complexity:2, type:"Carrossel", tags:["branding"],      linha:"produtos",   campanha:null,        link:"", ref:"", notes:"" },
  { id:22, title:"YouTube tour escritório",       owner:"Lu",     platform:"canal",  date:"2026-05-28", time:"14:00", status:"prod",  complexity:5, type:"Vídeo",     tags:["branding"],      linha:"escritorio", campanha:null,        link:"", ref:"", notes:"" },
  { id:23, title:"TikTok trend cores",            owner:"Sâmia",  platform:"tiktok", date:"2026-05-20", time:"21:00", status:"prod",  complexity:2, type:"Vídeo",     tags:["mh"],            linha:"trends",     campanha:null,        link:"", ref:"", notes:"" },
  { id:24, title:"Story produto Care detalhe",    owner:"Lara",   platform:"ig",     date:"2026-05-09", time:"10:00", status:"pub",   complexity:1, type:"Story",     tags:["campanha"],      linha:"produtos",   campanha:"care",      link:"", ref:"", notes:"" },
  { id:25, title:"Reels namorados teaser",        owner:"Pat",    platform:"ig",     date:"2026-05-26", time:"18:00", status:"prod",  complexity:4, type:"Reels",     tags:["campanha","branding"], linha:"ads", campanha:"namorados", link:"", ref:"", notes:"" },
  { id:26, title:"Story enquete trends",          owner:"Lu",     platform:"ig",     date:"2026-05-13", time:"13:00", status:"prod",  complexity:1, type:"Story",     tags:["mh"],            linha:"trends",     campanha:null,        link:"", ref:"", notes:"" },
  { id:27, title:"Tweet ASMR thread",             owner:"Sâmia",  platform:"twitter",date:"2026-05-18", time:"15:00", status:"prod",  complexity:2, type:"Texto",     tags:["mh"],            linha:"asmr",       campanha:null,        link:"", ref:"", notes:"" },
  { id:28, title:"Reels home tour Lu",            owner:"Lu",     platform:"ig",     date:"2026-04-28", time:"19:00", status:"pub",   complexity:4, type:"Reels",     tags:["branding"],      linha:"escritorio", campanha:null,        link:"", ref:"", notes:"" },
  { id:29, title:"Carrossel novos produtos",      owner:"Pat",    platform:"ig",     date:"2026-06-02", time:"10:00", status:"prod",  complexity:3, type:"Carrossel", tags:["branding"],      linha:"produtos",   campanha:null,        link:"", ref:"", notes:"" },
  { id:30, title:"Reels Brasil x Argentina",      owner:"Arno",   platform:"ig",     date:"2026-06-12", time:"20:00", status:"prod",  complexity:4, type:"Reels",     tags:["futebol","campanha"], linha:"ads", campanha:"copa", link:"", ref:"", notes:"" },
];

// Datas comemorativas
const EVENT_TYPES = [
  { id:"futebol",     label:"Futebol",      color:"#10B981" },
  { id:"evento",      label:"Evento",       color:"#6366F1" },
  { id:"filme",       label:"Filme/Série",  color:"#EC4899" },
];

const PACKAGES = ["PP","P","M","G"];
const FORMATS = ["Story","Estático","Coleção","Reels","Campanha"];

const COMEMORATIVAS = [
  { id:1, type:"evento", name:"Dia das Mães",         start:"2026-05-10", end:"2026-05-10", pack:"G",  potencial:true,  postado:true,  format:"Campanha" },
  { id:2, type:"evento", name:"Dia dos Namorados",    start:"2026-06-12", end:"2026-06-12", pack:"G",  potencial:true,  postado:false, format:"Campanha" },
  { id:3, type:"futebol",name:"Copa do Mundo",        start:"2026-06-11", end:"2026-07-19", pack:"G",  potencial:true,  postado:false, format:"Campanha" },
  { id:4, type:"filme",  name:"Lançamento Avatar 3",  start:"2026-05-22", end:"2026-05-22", pack:"M",  potencial:true,  postado:false, format:"Reels" },
  { id:5, type:"evento", name:"Festa Junina",         start:"2026-06-24", end:"2026-06-24", pack:"M",  potencial:true,  postado:false, format:"Coleção" },
  { id:6, type:"filme",  name:"Stranger Things S5",   start:"2026-05-30", end:"2026-05-30", pack:"M",  potencial:true,  postado:false, format:"Estático" },
  { id:7, type:"evento", name:"Dia da Mulher",        start:"2026-03-08", end:"2026-03-08", pack:"G",  potencial:true,  postado:true,  format:"Campanha" },
  { id:8, type:"evento", name:"Páscoa",               start:"2026-04-05", end:"2026-04-05", pack:"M",  potencial:true,  postado:true,  format:"Estático" },
  { id:9, type:"futebol",name:"Libertadores Final",   start:"2026-11-28", end:"2026-11-28", pack:"P",  potencial:false, postado:false, format:"Story" },
  { id:10,type:"filme",  name:"Wicked Part 2",        start:"2026-11-21", end:"2026-11-21", pack:"P",  potencial:true,  postado:false, format:"Story" },
  { id:11,type:"evento", name:"Black Friday",         start:"2026-11-27", end:"2026-11-27", pack:"G",  potencial:true,  postado:false, format:"Campanha" },
  { id:12,type:"evento", name:"Dia dos Pais",         start:"2026-08-09", end:"2026-08-09", pack:"G",  potencial:true,  postado:false, format:"Campanha" },
  { id:13,type:"filme",  name:"Mission Impossible 8", start:"2026-05-15", end:"2026-05-15", pack:"P",  potencial:false, postado:false, format:"Story" },
  { id:14,type:"evento", name:"Volta às aulas",       start:"2026-02-01", end:"2026-02-15", pack:"G",  potencial:true,  postado:true,  format:"Campanha" },
];

// Futebol 2026
const FUT_TYPES = [
  { id:"aniversario",  label:"Aniversário",     color:"#F59E0B" },
  { id:"brasil",       label:"Brasil",          color:"#10B981" },
  { id:"jogo",         label:"Jogo Importante", color:"#6366F1" },
  { id:"copa",         label:"Copa",            color:"#EF4444" },
  { id:"final",        label:"Final",           color:"#EC4899" },
  { id:"premiacao",    label:"Premiação",       color:"#8B5CF6" },
];

const FUTEBOL_2026 = [
  { id:1,  type:"copa",        name:"Abertura Copa do Mundo",        date:"2026-06-11" },
  { id:2,  type:"brasil",      name:"Brasil x Sérvia (Estreia)",     date:"2026-06-15" },
  { id:3,  type:"jogo",        name:"Argentina x França",            date:"2026-06-18" },
  { id:4,  type:"brasil",      name:"Brasil x Camarões",             date:"2026-06-20" },
  { id:5,  type:"brasil",      name:"Brasil x Suíça",                date:"2026-06-25" },
  { id:6,  type:"jogo",        name:"Oitavas - confronto Brasil",    date:"2026-07-01" },
  { id:7,  type:"final",       name:"Final Copa do Mundo",           date:"2026-07-19" },
  { id:8,  type:"final",       name:"Final Champions League",        date:"2026-05-30" },
  { id:9,  type:"final",       name:"Final Libertadores",            date:"2026-11-28" },
  { id:10, type:"premiacao",   name:"Bola de Ouro 2026",             date:"2026-10-26" },
  { id:11, type:"aniversario", name:"Aniversário Pelé",              date:"2026-10-23" },
  { id:12, type:"aniversario", name:"Aniversário Neymar",            date:"2026-02-05" },
  { id:13, type:"aniversario", name:"Aniversário Messi",             date:"2026-06-24" },
  { id:14, type:"jogo",        name:"Brasileirão - Fla x Flu",       date:"2026-05-17" },
  { id:15, type:"jogo",        name:"Brasileirão - Clássico",        date:"2026-05-24" },
  { id:16, type:"copa",        name:"Sorteio Grupos Copa",           date:"2026-04-05" },
];

// Campanhas
const CAMP_TIPOS = ["Institucional","Coleção","Produto","Data Comemorativa"];

const CAMPAIGNS_LIST = [
  { id:1, slug:"care",      nome:"Linha Care - Lançamento Verão", pack:"G", dono:"Lara",   tipo:"Coleção",          mes:"Maio",      dataInsta:"2026-05-13", dataSite:"2026-05-15", dataComercial:"2026-05-10", dataFinal:"2026-06-15", previsao:"2026-05-13", launched:false, progresso:75 },
  { id:2, slug:"copa",      nome:"Copa 2026",                     pack:"G", dono:"Arno",   tipo:"Data Comemorativa",mes:"Junho",     dataInsta:"2026-06-10", dataSite:"2026-06-08", dataComercial:"2026-06-05", dataFinal:"2026-07-20", previsao:"2026-06-11", launched:false, progresso:40 },
  { id:3, slug:"namorados", nome:"Dia dos Namorados",             pack:"M", dono:"Pat",    tipo:"Data Comemorativa",mes:"Junho",     dataInsta:"2026-06-05", dataSite:"2026-06-01", dataComercial:"2026-05-28", dataFinal:"2026-06-12", previsao:"2026-06-12", launched:false, progresso:60 },
  { id:4, slug:"asmr-col",  nome:"Coleção Asmr",                  pack:"P", dono:"Sâmia",  tipo:"Coleção",          mes:"Maio",      dataInsta:"2026-05-20", dataSite:"2026-05-22", dataComercial:"2026-05-18", dataFinal:"2026-06-30", previsao:"2026-05-20", launched:false, progresso:25 },
  { id:5, slug:"hometour",  nome:"Branding - Hometour Lu",        pack:"P", dono:"Lu",     tipo:"Institucional",    mes:"Maio",      dataInsta:"2026-05-28", dataSite:"-",          dataComercial:"-",          dataFinal:"2026-06-05", previsao:"2026-05-28", launched:false, progresso:85 },
  { id:6, slug:"maes",      nome:"Dia das Mães",                  pack:"G", dono:"Lara",   tipo:"Data Comemorativa",mes:"Maio",      dataInsta:"2026-05-10", dataSite:"2026-05-05", dataComercial:"2026-05-01", dataFinal:"2026-05-12", previsao:"2026-05-10", launched:true,  progresso:100 },
  { id:7, slug:"carteira",  nome:"Produto Hero - Carteira",       pack:"M", dono:"Pat",    tipo:"Produto",          mes:"Julho",     dataInsta:"2026-07-08", dataSite:"2026-07-10", dataComercial:"2026-07-05", dataFinal:"2026-08-10", previsao:"2026-07-08", launched:false, progresso:10 },
  { id:8, slug:"pele",      nome:"Pelé Forever",                  pack:"P", dono:"Arno",   tipo:"Institucional",    mes:"Outubro",   dataInsta:"2026-10-23", dataSite:"-",          dataComercial:"-",          dataFinal:"2026-10-30", previsao:"2026-10-23", launched:false, progresso:5 },
];

window.SH_DATA = {
  TEAM, TEAM_PROFILES, PLATFORMS, STATUSES, TAGS, LINHAS_ED, CAMPANHAS,
  CONTENT_TYPES_IG, CONTENT_TYPES_OTHER,
  POSTS, EVENT_TYPES, PACKAGES, FORMATS, COMEMORATIVAS,
  FUT_TYPES, FUTEBOL_2026, CAMP_TIPOS, CAMPAIGNS_LIST,
};
