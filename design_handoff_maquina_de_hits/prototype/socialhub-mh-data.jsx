/* ============================================================
   MH DATA EXTENSIONS
   - CREATORS: 5 creators contratados, cada um com semana relativa
   - STATUSES_MH: estende STATUSES com 'pauta' e 'entregue'
   - MH_POSTS: posts mock baseados em linhas reais da planilha
   ============================================================ */

/* Today: May 22, 2026 (Friday) — base for all mock dates */

/* ---- Creators ---- */
const CREATORS = [
  {
    id: 'CARINA',
    name: 'Carina',
    initial: 'C',
    color: 'oklch(0.65 0.17 18)',  // warm coral
    dataEntrada: '2024-10-05',  // ~85 weeks ago
    semanaAtual: 85,
    dropboxPath: '/Creators/Carina',
  },
  {
    id: 'REBECA',
    name: 'Rebeca',
    initial: 'R',
    color: 'oklch(0.6 0.16 290)',  // violet
    dataEntrada: '2025-03-31',  // ~60 weeks ago
    semanaAtual: 60,
    dropboxPath: '/Creators/Rebeca',
  },
  {
    id: 'THA',
    name: 'Tha',
    initial: 'T',
    color: 'oklch(0.62 0.15 150)',  // green
    dataEntrada: '2025-07-14',  // ~45 weeks ago
    semanaAtual: 45,
    dropboxPath: '/Creators/Tha',
  },
  {
    id: 'MARINA',
    name: 'Marina',
    initial: 'M',
    color: 'oklch(0.6 0.16 230)',  // blue
    dataEntrada: '2026-01-19',  // ~18 weeks ago
    semanaAtual: 18,
    dropboxPath: '/Creators/Marina',
  },
  {
    id: 'RECICLADO',
    name: 'Reciclado',
    initial: '↻',
    color: 'oklch(0.55 0.05 280)',  // muted (not a real person, recycled content slot)
    dataEntrada: '2025-10-06',  // ~32 weeks ago
    semanaAtual: 32,
    dropboxPath: '/Creators/Reciclado',
    isVirtual: true,  // not a real person, conceptual slot
  },
];

const CREATORS_BY_ID = Object.fromEntries(CREATORS.map(c => [c.id, c]));

/* ---- Status extensions: 'pauta' and 'entregue' for MH only ---- */
const STATUSES_MH = [
  { id: 'pauta',    label: 'Em pauta',  className: 's-pauta',    dot: 'oklch(0.55 0.12 280)' },
  { id: 'entregue', label: 'Entregue',  className: 's-entregue', dot: 'oklch(0.55 0.14 165)' },
  { id: 'prod',     label: 'Em produção',className: 's-prod',     dot: 'oklch(0.62 0.13 75)'  },
  { id: 'sched',    label: 'Agendado',  className: 's-sched',    dot: 'oklch(0.6 0.13 265)'  },
  { id: 'pub',      label: 'Publicado', className: 's-pub',      dot: 'oklch(0.6 0.13 150)'  },
  { id: 'cancel',   label: 'Cancelado', className: 's-cancel',   dot: 'oklch(0.6 0.05 25)'   },
];

const STATUS_LABEL_MH = Object.fromEntries(STATUSES_MH.map(s => [s.id, s.label]));
const STATUS_DOT_MH = Object.fromEntries(STATUSES_MH.map(s => [s.id, s.dot]));

/* ---- Helper: semana label "S85" ---- */
const semanaLabel = (n) => `S${String(n).padStart(2, '0')}`;
const videoLabel = (n) => `V${String(n).padStart(2, '0')}`;

/* ---- MH POSTS — sourced from the spreadsheet (preserved hooks/products) ----
   Dates anchored around May 22, 2026 (today).
   Each post has: creator, semanaCreator (creator-relative), numVideo,
   primary IG (date/time/status), optional repostTT (date/time/status),
   hook (title), ref, product, audio, prazo (delivery deadline),
   notes, dropboxLink (folder), briefingFile (.txt in folder).
*/
const MH_POSTS_RAW = [
  // === CARINA — semana atual 85 ===
  {
    creator: 'CARINA', semanaCreator: 85, numVideo: 1,
    hook: 'pov: aquela amiga que acha tudo aesthetic',
    product: 'Tote Puffer · Case',
    audio: 'pop indie / Phoebe Bridgers',
    prazo: '2026-05-18',
    ref: 'https://www.tiktok.com/@wayshot_app/video/7559708189260893470',
    primary: { date: '2026-05-20', time: '18:00', status: 'pub', type: 'Reels' },
    repost:  { date: '2026-06-03', time: '12:00', status: 'sched', type: 'Vídeo' },
    notes: 'Take ainda mais lento, sem cortes na primeira metade.',
    caption: 'minha melhor amiga é assim 🤍✨ marca aquela amiga que acha tudo aesthetic\n\n#gocase #aesthetic',
    link: 'https://www.dropbox.com/scl/fi/abc123/video-01-com-texto.mp4',
    coverLink: 'https://www.dropbox.com/scl/fi/cap123/video-01-capa.jpg',
  },
  {
    creator: 'CARINA', semanaCreator: 85, numVideo: 2,
    hook: 'eu narrando todos os passos da viagem pra minha mãe',
    product: 'Tote Puffer · Mala de Bordo Trip',
    audio: 'voz natural, sem música',
    prazo: '2026-05-18',
    ref: '',
    primary: { date: '2026-05-21', time: '12:00', status: 'pub' },
    repost:  { date: '2026-06-04', time: '12:00', status: 'sched' },
  },
  {
    creator: 'CARINA', semanaCreator: 85, numVideo: 3,
    hook: 'dia 1 sem beber coca zero / dia 2 / dia 1 / dia 1',
    product: 'Case Classic',
    audio: 'piano triste',
    prazo: '2026-05-22',
    ref: 'https://vt.tiktok.com/ZSa2yBQjx/',
    primary: { date: '2026-05-22', time: '18:00', status: 'sched' },
    repost:  null,
  },
  {
    creator: 'CARINA', semanaCreator: 85, numVideo: 4,
    hook: 'eu tentando fazer caber na mala 48 roupas, 16 biquínis, 1 kg de glitter',
    product: 'Mala de Bordo Trip',
    audio: 'beat acelerado',
    prazo: '2026-05-25',
    ref: 'https://www.instagram.com/p/DQQVHhNDEeX/',
    primary: { date: '2026-05-25', time: '12:00', status: 'entregue' },
    repost:  null,
    dropboxLink: '/Creators/Carina/SEMANA 85/',
  },
  {
    creator: 'CARINA', semanaCreator: 85, numVideo: 5,
    hook: 'eu decidindo entre ficar em casa e ter FOMO ou sair e ficar desconfortável o tempo inteiro',
    product: 'Tote Shopper',
    audio: 'lo-fi',
    prazo: '2026-05-25',
    ref: 'https://www.tiktok.com/@joannastz/video/7595722066523852052',
    primary: { date: '2026-05-26', time: '18:00', status: 'pauta' },
    repost:  null,
  },

  // === REBECA — semana atual 60 ===
  {
    creator: 'REBECA', semanaCreator: 60, numVideo: 1,
    hook: 'pov: você odeia fazer duas viagens',
    product: 'Copo Life · Case',
    audio: 'trend audio TikTok BR',
    prazo: '2026-05-15',
    ref: 'https://www.instagram.com/reel/DT-fBD1DfdJ/',
    primary: { date: '2026-05-19', time: '18:00', status: 'pub' },
    repost:  { date: '2026-06-02', time: '12:00', status: 'sched' },
  },
  {
    creator: 'REBECA', semanaCreator: 60, numVideo: 2,
    hook: 'pessoas normais x pessoas estranhas usando mochila',
    product: 'Mochila Pop',
    audio: '',
    prazo: '2026-05-20',
    ref: 'https://www.tiktok.com/@gocase/video/7322493386747858181',
    primary: { date: '2026-05-23', time: '12:00', status: 'entregue' },
    repost:  null,
    dropboxLink: '/Creators/Rebeca/SEMANA 60/',
  },
  {
    creator: 'REBECA', semanaCreator: 60, numVideo: 3,
    hook: 'pov: você tem medo do seu namorado pegar seu celular? eu com medo dele comer meu sushi',
    product: 'Case',
    audio: 'pop romântico irônico',
    prazo: '2026-05-25',
    ref: 'https://www.instagram.com/reels/C_1OP6fSuwe/',
    primary: { date: '2026-05-26', time: '18:00', status: 'pauta' },
    repost:  null,
  },
  {
    creator: 'REBECA', semanaCreator: 59, numVideo: 5,
    hook: 'quando ta todo mundo se divertindo e eu tô no cantinho desinstalando até a calculadora',
    product: 'Case',
    audio: '',
    prazo: '2026-05-08',
    ref: 'https://www.instagram.com/reel/DTgWJ03lMTV/',
    primary: { date: '2026-05-15', time: '12:00', status: 'pub' },
    repost:  { date: '2026-05-28', time: '12:00', status: 'sched' },
  },

  // === THA — semana atual 45 ===
  {
    creator: 'THA', semanaCreator: 45, numVideo: 1,
    hook: 'pov: eu chegando no escritório quarta feira 14h',
    product: 'Tote Puffer · Copo Térmico',
    audio: 'música preguiçosa',
    prazo: '2026-05-27',
    ref: '',
    primary: { date: '2026-05-28', time: '12:00', status: 'pauta' },
    repost:  null,
  },
  {
    creator: 'THA', semanaCreator: 45, numVideo: 2,
    hook: 'a dica que vai mudar sua vida: (tirar adesivo com secador)',
    product: 'Case',
    audio: '',
    prazo: '2026-05-22',
    ref: '',
    primary: { date: '2026-05-22', time: '19:00', status: 'entregue' },
    repost:  null,
    dropboxLink: '/Creators/Tha/SEMANA 45/',
  },
  {
    creator: 'THA', semanaCreator: 44, numVideo: 1,
    hook: 'vai viajar pra onde no carnaval',
    product: 'Tote Puffer',
    audio: '',
    prazo: '2026-05-12',
    ref: '',
    primary: { date: '2026-05-13', time: '12:00', status: 'pub' },
    repost:  { date: '2026-05-20', time: '12:00', status: 'pub' },
  },

  // === MARINA — semana atual 18 ===
  {
    creator: 'MARINA', semanaCreator: 18, numVideo: 1,
    hook: '"desculpa não te responder ontem, cheguei em casa e dormi" o que eu imagino:',
    product: 'Case · Tote Puffer',
    audio: 'música tensa',
    prazo: '2026-05-21',
    ref: 'https://www.instagram.com/reel/DN1pe15XK58/',
    primary: { date: '2026-05-22', time: '17:00', status: 'sched' },
    repost:  null,
  },
  {
    creator: 'MARINA', semanaCreator: 18, numVideo: 2,
    hook: 'eu com vergonha de postar uma foto MINHA no MEU instagram',
    product: 'Case',
    audio: '',
    prazo: '2026-05-26',
    ref: 'https://www.instagram.com/reel/DTspnaZDW_y/',
    primary: { date: '2026-05-27', time: '12:00', status: 'pauta' },
    repost:  null,
  },
  {
    creator: 'MARINA', semanaCreator: 17, numVideo: 3,
    hook: 'eu vendo meu namorado montar meu prato depois de cozinhar pra mim',
    product: 'Taça Térmica Drink',
    audio: '',
    prazo: '2026-05-08',
    ref: 'https://www.tiktok.com/@duasnacoesumamor/video/7597626795017473298',
    primary: { date: '2026-05-14', time: '17:00', status: 'pub' },
    repost:  { date: '2026-05-21', time: '12:00', status: 'pub' },
  },

  // === RECICLADO — semana atual 32 ===
  {
    creator: 'RECICLADO', semanaCreator: 32, numVideo: 1,
    hook: 'testando se a cerveja de 600ml cabe no copo de 470ml',
    product: 'Copo Térmico',
    audio: '',
    prazo: '2026-05-10',
    ref: '',
    primary: { date: '2026-05-12', time: '18:00', status: 'pub' },
    repost:  { date: '2026-05-12', time: '18:00', status: 'pub' },
    notes: 'Conteúdo reciclado do acervo Q1.',
  },
];

/* Convert MH raw posts to post objects compatible with the existing modal/calendar.
   Each "raw" post becomes ONE post object, with an extra `mh` payload
   containing the MH-specific fields. Calendar expansion (IG vs TT) is done
   at render time in the MH calendar component. */
function buildMHPosts(startId = 100) {
  return MH_POSTS_RAW.map((r, i) => {
    // Normalize repost with a default type
    const repost = r.repost
      ? { type: 'Vídeo', ...r.repost }
      : null;
    return {
      id: startId + i,
      title: r.hook,
      owner: 'Eduarda',  // social media producer (internal owner)
      platform: 'ig',
      date: r.primary.date,
      time: r.primary.time,
      status: r.primary.status,
      complexity: 2,
      type: r.primary.type || 'Reels',  // IG type (used in CSV export)
      tags: ['mh'],
      linha: 'trends',
      campanha: null,
      product: r.product,
      // Shared content fields (same for both IG and TT exports)
      caption: r.caption || '',
      link: r.link || '',         // "Link da mídia" — vídeo com texto no Dropbox
      coverLink: r.coverLink || '', // "Link da capa" — imagem de capa no Dropbox
      postLink: '',
      ref: r.ref || '',
      notes: r.notes || '',
      // MH-specific payload
      mh: {
        creator: r.creator,
        semanaCreator: r.semanaCreator,
        numVideo: r.numVideo,
        audio: r.audio || '',
        prazo: r.prazo,
        dropboxLink: r.dropboxLink || '',
        briefingFile: `/Creators/${CREATORS_BY_ID[r.creator]?.name || r.creator}/pautas-semana-${r.semanaCreator}.txt`,
        repostTT: repost,  // { date, time, status, type } or null
      },
    };
  });
}

const MH_POSTS = buildMHPosts(100);

/* For demo: produce a combined list with original mock posts + MH posts.
   Strip the original `mh`-tagged posts from INITIAL_POSTS (the old mock) and
   replace them with our richer dataset. */
const INITIAL_POSTS_MH = [
  ...INITIAL_POSTS.filter(p => !p.tags?.includes('mh')),
  ...MH_POSTS,
];

/* ---- Helper: expand MH posts for calendar (1 post → 1 or 2 calendar entries) ---- */
function expandMHForCalendar(posts) {
  const out = [];
  for (const p of posts) {
    const mh = p.mh;
    if (!mh) {
      out.push(p);
      continue;
    }
    // Primary card (IG)
    out.push({
      ...p,
      _mhSide: 'ig',
      _mhHasMate: !!mh.repostTT,
      _mhMateDate: mh.repostTT?.date,
    });
    // Repost card (TT)
    if (mh.repostTT) {
      out.push({
        ...p,
        id: `${p.id}-tt`,
        _origId: p.id,
        platform: 'tiktok',
        date: mh.repostTT.date,
        time: mh.repostTT.time,
        status: mh.repostTT.status,
        _mhSide: 'tt',
        _mhHasMate: true,
        _mhMateDate: p.date,
      });
    }
  }
  return out;
}

/* ---- Helper: per-creator aggregate metrics ---- */
function creatorMetrics(creatorId, allPosts) {
  const c = CREATORS_BY_ID[creatorId];
  if (!c) return null;
  const mine = allPosts.filter(p => p.mh && p.mh.creator === creatorId);
  const semanaAtual = c.semanaAtual;
  // Total videos this creator has delivered over their life (extrapolated)
  // For mock: derive from "avg per week × semanas atual"
  const knownVideos = mine.length;
  const avgPerWeek = 2.4 + (creatorId === 'CARINA' ? 0.8 : 0) + (creatorId === 'RECICLADO' ? -1.4 : 0);
  const totalExtrapolated = Math.round(avgPerWeek * semanaAtual);
  const thisWeekCount = mine.filter(p => p.mh.semanaCreator === semanaAtual).length;
  const emPautaCount = mine.filter(p => p.status === 'pauta').length;
  const noPrazoPct = creatorId === 'CARINA' ? 94 :
                     creatorId === 'REBECA' ? 91 :
                     creatorId === 'THA'    ? 92 :
                     creatorId === 'MARINA' ? 88 :
                     creatorId === 'RECICLADO' ? 85 : 90;

  // 12-week histogram (last 12 semanas)
  const histogram = [];
  for (let i = 11; i >= 0; i--) {
    const sem = semanaAtual - i;
    // mock distribution: 2-4 vids per week, with some randomness based on creator+sem
    const seed = (creatorId.charCodeAt(0) + sem) % 7;
    const val = Math.max(0, Math.round(avgPerWeek + (seed - 3) * 0.5));
    histogram.push({ semana: sem, count: val, isCurrent: i === 0 });
  }

  return {
    semanaAtual,
    total: totalExtrapolated,
    thisWeek: thisWeekCount || histogram[histogram.length - 1].count,
    emPauta: emPautaCount,
    avgPerWeek: avgPerWeek.toFixed(1),
    noPrazoPct,
    histogram,
    posts: mine,
  };
}

Object.assign(window, {
  CREATORS,
  CREATORS_BY_ID,
  STATUSES_MH,
  STATUS_LABEL_MH,
  STATUS_DOT_MH,
  semanaLabel,
  videoLabel,
  MH_POSTS,
  INITIAL_POSTS_MH,
  expandMHForCalendar,
  creatorMetrics,
});
