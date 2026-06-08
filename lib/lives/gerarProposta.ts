// ============================================================================
// Geração da proposta SEMANAL de cupons das lives.
//
// Port 1:1 do algoritmo em cupons-gocase/scripts/gerar_proposta.py.
// Função PURA: recebe dados agregados, devolve a proposta. Não fala com banco.
//
// Regras (resumo — detalhes inline):
//  - Saturação: cada merchan no máximo 2x na semana.
//  - CUPOM 2: máx 1 dia da semana, não consecutivo, nunca em dia de merchan
//    `sempreSozinho`, e o CUPOM 2 nunca é `sempreSozinho`.
//  - Anti-repetição: nunca o mesmo merchan principal em 2 dias seguidos
//    (vale também contra a última live ANTES da semana — continuidade).
//  - Anti-triplo-consecutivo: nunca 2 triplos em dias seguidos (idem virada).
//  - Boost de merchan `forte`: ×1.4 só nos dias 1-5 do mês.
//  - Freshness: decay 0.88 por uso nos últimos 14 dias.
//  - Saturação dentro da semana: decay 0.75 por uso já dado na semana.
//  - Score (smoothing bayesiano):
//       (media*usos + media_global*MIN_USOS_CONFIAVEL) / (usos + MIN_USOS_CONFIAVEL)
//  - Nomes ≤15 chars, vocabulário real, sem repetir nomes dos últimos ~30 dias.
// ============================================================================

// ─── Constantes de domínio ───────────────────────────────────────────────────

export const SATURACAO_SEMANA = 2
export const MAX_DIAS_COM_2_CUPONS = 1
export const MIN_USOS_CONFIAVEL = 3
export const TAMANHO_MAX_NOME = 15
export const JANELA_RECENTE_DIAS = 14
export const JANELA_NOMES_DIAS = 30

// WEEKDAY_NOMES indexado por Date.getUTCDay() (domingo=0)
const WEEKDAY_NOMES = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
] as const

// Triplo = 3 benefícios (≥2 ocorrências de ' + ')
export function ehTriplo(nome: string): boolean {
  if (!nome) return false
  return (nome.split(' + ').length - 1) >= 2
}

// ─── Vocabulário de nomenclatura ─────────────────────────────────────────────

const TOKENS_DIA: Record<string, string[]> = {
  'segunda-feira': ['SEGUNDA'],
  'terça-feira':   ['TERCA'],
  'quarta-feira':  ['QUARTA'],
  'quinta-feira':  ['QUINTA'],
  'sexta-feira':   ['SEXTA'],
  'sábado':        ['SABADO'],
  'domingo':       ['DOMINGO'],
}

const TOKENS_NEUTROS = ['LIVE', 'INSTA', 'STORY', 'MEGA']
const TOKENS_HYPE    = ['TOP', 'HOJE', 'AGORA', 'FREE', 'PROMO']

const TOKENS_MERCHAN: Record<string, string[]> = {
  'DESCONTO + FRETE GRÁTIS':                ['OFF', 'FRETE'],
  'DESCONTO + 3X SEM JUROS':                ['3X', 'OFF'],
  'DESCONTO + MIMO':                        ['MIMO', 'OFF'],
  'FRETE GRÁTIS + MIMO':                    ['MIMO', 'FRETE'],
  'FRETE GRÁTIS + 3X SEM JUROS':            ['FRETE', '3X'],
  '3X SEM JUROS + MIMO':                    ['MIMO', '3X'],
  'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS': ['MEGA', 'TRIPLO'],
  'DESCONTO + FRETE GRÁTIS + MIMO':         ['MEGA', 'TRIPLO'],
  'R$20 OFF EM COMPRAS A PARTIR DE R$150':  ['20'],
  '10% OFF EM COMPRAS A PARTIR DE R$99':    ['10'],
  'DESCONTO SURPRESA + MIMO':               ['MIMO', 'OFF'],
  '2 MIMOS':                                ['MIMO'],
}

const NOMES_BLOQUEADOS = new Set([
  'SABVIP', 'SEGTOP', '3XMIMO10', '2011', 'LIVE3XF', '3XMIMO18',
  'GIFT20', '3XF21', 'SEGPROMO', 'GOCASEHOJE', 'QUIAGORA', '3X27', 'DOMMEGA',
])

function temNumeroColadoEstranho(nome: string): boolean {
  // 13–19 e 21–31 são "estranhos"; 20 é OK (R$20 OFF).
  const m = nome.match(/(\d+)$/)
  if (!m) return false
  const n = parseInt(m[1], 10)
  return n > 12 && n <= 31 && n !== 20
}

// ─── RNG seedável (mulberry32) ───────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function next(): number {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeChoice(rng: () => number) {
  return <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
}

// ─── Geração de nomes ────────────────────────────────────────────────────────

function gerarNome(
  merchan: string,
  diaSemana: string,
  nomesUsados: Set<string>,
  rng: () => number,
): string {
  const choice = makeChoice(rng)
  const tokensDia     = TOKENS_DIA[diaSemana] ?? ['LIVE']
  const tokensMerchan = TOKENS_MERCHAN[merchan] ?? ['OFF']

  const estrategias: Array<() => string> = [
    () => choice(tokensDia) + choice(TOKENS_HYPE),
    () => choice(TOKENS_NEUTROS) + choice(TOKENS_HYPE),
    () => choice(tokensDia) + choice(tokensMerchan),
    () => choice(TOKENS_NEUTROS) + choice(tokensMerchan),
    () => choice(tokensMerchan) + choice(TOKENS_HYPE),
    () => choice(tokensMerchan) + choice(tokensDia),
  ]

  for (let i = 0; i < 80; i++) {
    const nome = choice(estrategias)().toUpperCase()
    // Evita "SEGUNDASEGUNDA" / "MIMOMIMO" — primeira parte == última parte
    const partes = nome.match(/[A-Z]+|\d+/g) ?? []
    if (partes.length >= 2 && partes[0] === partes[partes.length - 1]) continue
    if (nome.length <= TAMANHO_MAX_NOME
        && !nomesUsados.has(nome)
        && !NOMES_BLOQUEADOS.has(nome)
        && !temNumeroColadoEstranho(nome)) {
      nomesUsados.add(nome)
      return nome
    }
  }

  // Fallback 1: tokensDia[0] + cada hype
  for (const hype of TOKENS_HYPE) {
    const nome = (tokensDia[0] + hype).toUpperCase()
    if (nome.length <= TAMANHO_MAX_NOME && !nomesUsados.has(nome)) {
      nomesUsados.add(nome)
      return nome
    }
  }

  // Fallback 2: tokensDia[0] + 'TOP' + sufixo numérico
  let sufixo = 0
  while (true) {
    const candidato = (tokensDia[0] + 'TOP' + (sufixo === 0 ? '' : String(sufixo))).toUpperCase()
    if (!nomesUsados.has(candidato)) {
      nomesUsados.add(candidato)
      return candidato
    }
    sufixo = sufixo === 0 ? 2 : sufixo + 1
  }
}

// ─── Datas (UTC pra evitar surpresa de fuso) ─────────────────────────────────

function parseIsoUTC(s: string): Date {
  return new Date(s + 'T00:00:00Z')
}
function toIsoUTC(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function addDaysUTC(d: Date, n: number): Date {
  const r = new Date(d.getTime())
  r.setUTCDate(r.getUTCDate() + n)
  return r
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

export interface ScoreRow {
  diaSemana: string
  merchan:   string
  media:     number
  usos:      number
}

export interface MerchanInfo {
  nome:           string
  ativo:          boolean
  forte:          boolean
  sempreSozinho:  boolean
}

interface ScoredCandidate {
  merchan: string
  score:   number
  usos:    number
}

function calcularScores(
  scoresAgg: ScoreRow[],
  ativos: Set<string>,
  mediaGlobalOpt: number | null,
): Map<string, ScoredCandidate[]> {
  let mediaGlobal = mediaGlobalOpt
  if (mediaGlobal == null) {
    const tot = scoresAgg.reduce((s, r) => s + r.media * r.usos, 0)
    const n   = scoresAgg.reduce((s, r) => s + r.usos, 0)
    mediaGlobal = n > 0 ? tot / n : 0
  }
  const out = new Map<string, ScoredCandidate[]>()
  for (const r of scoresAgg) {
    if (!ativos.has(r.merchan)) continue
    const media = Number(r.media), usos = Number(r.usos)
    const score = (media * usos + mediaGlobal * MIN_USOS_CONFIAVEL) / (usos + MIN_USOS_CONFIAVEL)
    if (!out.has(r.diaSemana)) out.set(r.diaSemana, [])
    out.get(r.diaSemana)!.push({ merchan: r.merchan, score, usos })
  }
  for (const arr of out.values()) arr.sort((a, b) => b.score - a.score)
  return out
}

// ─── Distribuição semanal ────────────────────────────────────────────────────

interface RecenteRow {
  date:     string
  merchan1: string
  merchan2: string
}

interface ProposalSlot {
  data:     Date
  semana:   string
  merchan1: string
  merchan2: string  // '' se não houver
}

function escolher(
  ajustados: Array<[string, number]>,
  ultimo: string | null,
  ultimoTriplo: boolean,
  contador: Map<string, number>,
  limite: number,
): string | null {
  for (const [merchan] of ajustados) {
    if (merchan === ultimo) continue
    if (ultimoTriplo && ehTriplo(merchan)) continue
    if ((contador.get(merchan) ?? 0) >= limite) continue
    return merchan
  }
  return null
}

function distribuirSemana(
  semanaInicio: Date,
  scoresPorDia: Map<string, ScoredCandidate[]>,
  merchansInfo: Map<string, MerchanInfo>,
  recentes: RecenteRow[],
): ProposalSlot[] {
  // 7 dias da semana
  const dias: { data: Date; semana: string }[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDaysUTC(semanaInicio, i)
    dias.push({ data: d, semana: WEEKDAY_NOMES[d.getUTCDay()] })
  }

  const fortes   = new Set<string>()
  const sozinhos = new Set<string>()
  for (const [nome, info] of merchansInfo) {
    if (info.forte)         fortes.add(nome)
    if (info.sempreSozinho) sozinhos.add(nome)
  }

  // ── Semear continuidade: última live ANTERIOR à semana
  const anteriores = recentes
    .filter(r => parseIsoUTC(r.date).getTime() < semanaInicio.getTime())
    .sort((a, b) => a.date.localeCompare(b.date))

  let ultimoMerchanPrincipal: string | null = null
  let ultimoEraTriplo = false
  if (anteriores.length > 0) {
    const ultimo = anteriores[anteriores.length - 1]
    const m = (ultimo.merchan1 || '').trim()
    if (m) {
      ultimoMerchanPrincipal = m
      ultimoEraTriplo = ehTriplo(m)
    }
  }

  // ── Penalidade de freshness: usos nos últimos 14 dias
  const limiteRecente = addDaysUTC(semanaInicio, -JANELA_RECENTE_DIAS)
  const usoRecente = new Map<string, number>()
  for (const r of anteriores) {
    if (parseIsoUTC(r.date).getTime() >= limiteRecente.getTime()) {
      for (const mk of ['merchan1', 'merchan2'] as const) {
        const m = (r[mk] || '').trim()
        if (m) usoRecente.set(m, (usoRecente.get(m) ?? 0) + 1)
      }
    }
  }

  const contadorUso = new Map<string, number>() // dentro da semana
  const proposta: ProposalSlot[] = []

  // ============== 1º PASS: CUPOM 1 ==============
  // Fallback se um dia da semana não tem score próprio: usa todos os candidatos achatados.
  const todosAchatados: ScoredCandidate[] = []
  for (const arr of scoresPorDia.values()) todosAchatados.push(...arr)
  todosAchatados.sort((a, b) => b.score - a.score)

  for (const { data, semana } of dias) {
    let candidatos = scoresPorDia.get(semana)
    if (!candidatos || candidatos.length === 0) candidatos = todosAchatados

    const ehInicioMes = data.getUTCDate() <= 5

    const ajustados: Array<[string, number]> = candidatos.map(c => {
      let s = c.score
      if (ehInicioMes && fortes.has(c.merchan)) s *= 1.4
      s *= Math.pow(0.75, contadorUso.get(c.merchan) ?? 0) // saturação intra-semana
      s *= Math.pow(0.88, usoRecente.get(c.merchan) ?? 0)  // freshness
      return [c.merchan, s]
    })
    ajustados.sort((a, b) => b[1] - a[1])

    let escolhido = escolher(ajustados, ultimoMerchanPrincipal, ultimoEraTriplo, contadorUso, SATURACAO_SEMANA)
    if (escolhido == null) {
      // Relaxa saturação (mantém anti-repetição e anti-triplo)
      escolhido = escolher(ajustados, ultimoMerchanPrincipal, ultimoEraTriplo, contadorUso, 99)
    }
    if (escolhido == null && ajustados.length > 0) escolhido = ajustados[0][0]
    if (escolhido == null) {
      // Sem candidatos — pula (mas o algoritmo presume merchans ativos)
      proposta.push({ data, semana, merchan1: '', merchan2: '' })
      continue
    }

    contadorUso.set(escolhido, (contadorUso.get(escolhido) ?? 0) + 1)
    ultimoMerchanPrincipal = escolhido
    ultimoEraTriplo = ehTriplo(escolhido)
    proposta.push({ data, semana, merchan1: escolhido, merchan2: '' })
  }

  // ============== 2º PASS: CUPOM 2 ==============
  // Elegíveis = dias cujo merchan1 NÃO é sempreSozinho.
  const elegiveis: number[] = []
  for (let i = 0; i < 7; i++) {
    if (proposta[i].merchan1 && !sozinhos.has(proposta[i].merchan1)) elegiveis.push(i)
  }
  // Prioridade: começo do mês > fim de semana > ordem natural
  elegiveis.sort((a, b) => {
    const aEarly = proposta[a].data.getUTCDate() <= 5 ? -1 : 0
    const bEarly = proposta[b].data.getUTCDate() <= 5 ? -1 : 0
    if (aEarly !== bEarly) return aEarly - bEarly
    const aWk = (proposta[a].semana === 'sábado' || proposta[a].semana === 'domingo') ? -1 : 0
    const bWk = (proposta[b].semana === 'sábado' || proposta[b].semana === 'domingo') ? -1 : 0
    if (aWk !== bWk) return aWk - bWk
    return a - b
  })

  const comCupom2 = new Set<number>()
  let aplicados = 0
  for (const idx of elegiveis) {
    if (aplicados >= MAX_DIAS_COM_2_CUPONS) break
    if (comCupom2.has(idx - 1) || comCupom2.has(idx + 1)) continue // não-consecutivo

    const item = proposta[idx]
    const candidatosDia = scoresPorDia.get(item.semana) ?? []
    const ajustados = candidatosDia
      .map(c => [
        c.merchan,
        c.score
          * Math.pow(0.75, contadorUso.get(c.merchan) ?? 0)
          * Math.pow(0.88, usoRecente.get(c.merchan) ?? 0),
      ] as [string, number])
      .sort((a, b) => b[1] - a[1])

    for (const [merchan] of ajustados) {
      if (merchan === item.merchan1) continue
      if (sozinhos.has(merchan)) continue
      if ((contadorUso.get(merchan) ?? 0) >= SATURACAO_SEMANA + 1) continue
      item.merchan2 = merchan
      contadorUso.set(merchan, (contadorUso.get(merchan) ?? 0) + 1)
      comCupom2.add(idx)
      aplicados++
      break
    }
  }

  return proposta
}

// ─── Nomes (aplica em todos os cupons) ───────────────────────────────────────

function aplicarNomes(
  proposta: ProposalSlot[],
  nomesRecentes: string[],
  rng: () => number,
): Array<ProposalSlot & { nominal1: string; nominal2: string }> {
  const nomesUsados = new Set<string>()
  for (const n of nomesRecentes) {
    const up = (n || '').trim().toUpperCase()
    if (up) nomesUsados.add(up)
  }
  return proposta.map(item => {
    const nominal1 = item.merchan1 ? gerarNome(item.merchan1, item.semana, nomesUsados, rng) : ''
    const nominal2 = item.merchan2 ? gerarNome(item.merchan2, item.semana, nomesUsados, rng) : ''
    return { ...item, nominal1, nominal2 }
  })
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export interface ProposalInput {
  semanaInicio:   string             // YYYY-MM-DD (segunda da semana alvo)
  scores:         ScoreRow[]         // {diaSemana, merchan, media, usos}
  mediaGlobal?:   number | null
  merchans:       MerchanInfo[]
  recentes:       RecenteRow[]       // últimos 14 dias antes da semana
  nomesRecentes:  string[]           // nominal1+nominal2 dos últimos ~30 dias
  seed?:          number             // default 42
}

export interface ProposalDay {
  date:      string  // YYYY-MM-DD
  diaSemana: string
  merchan1:  string
  nominal1:  string
  merchan2:  string  // '' se não houver
  nominal2:  string  // '' se não houver
}

export function gerarProposta(input: ProposalInput): ProposalDay[] {
  const semanaInicio = parseIsoUTC(input.semanaInicio)
  const merchansAtivos = input.merchans.filter(m => m.ativo)
  if (merchansAtivos.length === 0) throw new Error('Nenhum merchan ativo cadastrado.')
  if (input.scores.length === 0)  throw new Error('Sem histórico (scores vazios) — banco precisa de lives realizadas/confirmadas na janela.')

  const ativos = new Set(merchansAtivos.map(m => m.nome))
  const merchansInfo = new Map<string, MerchanInfo>(merchansAtivos.map(m => [m.nome, m]))
  const scoresPorDia = calcularScores(input.scores, ativos, input.mediaGlobal ?? null)

  const rng = mulberry32(input.seed ?? 42)
  const slots = distribuirSemana(semanaInicio, scoresPorDia, merchansInfo, input.recentes)
  const comNomes = aplicarNomes(slots, input.nomesRecentes, rng)

  return comNomes.map(s => ({
    date:      toIsoUTC(s.data),
    diaSemana: s.semana,
    merchan1:  s.merchan1,
    nominal1:  s.nominal1,
    merchan2:  s.merchan2,
    nominal2:  s.nominal2,
  }))
}

// ─── Helper: próxima segunda-feira (UTC) ────────────────────────────────────

export function proximaSegunda(referenciaIso: string): string {
  const d = parseIsoUTC(referenciaIso)
  // getUTCDay(): 0=dom, 1=seg, …, 6=sáb. Dias até a próxima segunda:
  const dow = d.getUTCDay()
  const diasAteSeg = dow === 1 ? 7 : (8 - dow) % 7 || 7
  return toIsoUTC(addDaysUTC(d, diasAteSeg))
}
