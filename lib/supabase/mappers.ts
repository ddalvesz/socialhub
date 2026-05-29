import type { Campaign, Collection, EventDate, FutebolEvent, Post, PostSource, PostStatus, Platform, Live, LiveStatus, Merchan } from '@/lib/types'
import { colorFromName, shortLabel } from '@/lib/livesUtils'

// Split comma-separated tags, uppercase, deduplicate
function normalizeTags(raw: string[]): string[] {
  const out = new Set<string>()
  for (const t of raw) {
    for (const part of t.split(',')) {
      const v = part.trim().toUpperCase()
      if (v) out.add(v)
    }
  }
  return [...out]
}

// ─── Post ────────────────────────────────────────────────────

export function dbToPost(row: Record<string, unknown>, source: PostSource): Post {
  return {
    id:                String(row.id),
    source,
    title:             (row.title as string) ?? '',
    owner:             (row.owner as string) ?? '',
    platform:          (row.platform as Platform) ?? 'ig',
    date:              (row.date as string) ?? '',
    time:              (row.time as string) ?? '12:00',
    status:            (row.status as PostStatus) ?? 'prod',
    format:            (row.format as string) ?? '',
    month:             (row.month as number) ?? undefined,
    tags:              normalizeTags((row.tags as string[]) ?? []),
    campaign:          (row.campaign as string) ?? '',
    product:           (row.product as string) ?? '',
    ref:               (row.ref as string) ?? '',
    link:              (row.link as string) ?? '',
    obs:               (row.obs as string) ?? '',
    deadline:          (row.deadline as string) ?? '',
    caption:           (row.caption as string) ?? '',
    videoLink:         (row.video_link as string) ?? '',
    coverLink:         (row.cover_link as string) ?? '',
    slideLinks:        (row.slide_links as string[]) ?? [],
    linkedPostId:      row.linked_post_id ? String(row.linked_post_id) : undefined,
    linkedPostSource:  (row.linked_post_source as PostSource) ?? undefined,
    // MH-specific
    semana:            (row.semana as number) ?? undefined,
    numVideo:          (row.num_video as number) ?? undefined,
    audio:             (row.audio as string) ?? undefined,
    prazo:             (row.prazo as string) ?? undefined,
    dropboxLink:       (row.dropbox_link as string) ?? undefined,
    briefingFile:      (row.briefing_file as string) ?? undefined,
  }
}

export function postToDb(p: Omit<Post, 'id' | 'source'>, source?: PostSource): Record<string, unknown> {
  const base: Record<string, unknown> = {
    title:              p.title,
    owner:              p.owner,
    platform:           p.platform,
    date:               p.date,
    time:               p.time,
    status:             p.status,
    format:             p.format,
    month:              p.month ?? null,
    tags:               p.tags,
    campaign:           p.campaign,
    product:            p.product,
    ref:                p.ref,
    link:               p.link,
    obs:                p.obs,
    deadline:           p.deadline,
    caption:            p.caption,
    video_link:         p.videoLink,
    cover_link:         p.coverLink,
    slide_links:        p.slideLinks ?? [],
    linked_post_id:     p.linkedPostId ?? null,
    linked_post_source: p.linkedPostSource ?? null,
  }
  if (source === 'mh') {
    base.semana       = p.semana ?? null
    base.num_video    = p.numVideo ?? null
    base.audio        = p.audio ?? null
    base.prazo        = p.prazo ?? null
    base.dropbox_link = p.dropboxLink ?? null
    base.briefing_file= p.briefingFile ?? null
  }
  return base
}

export function sourceToTable(source: PostSource): string {
  const map: Record<PostSource, string> = {
    mh:      'mh_posts',
    branding:'branding_posts',
    tiktok:  'tiktok_posts',
    twitter: 'twitter_posts',
    canal:   'canal_posts',
    copa:    'copa_posts',
  }
  return map[source]
}

// ─── Campaign ────────────────────────────────────────────────

export function dbToCampaign(row: Record<string, unknown>): Campaign {
  return {
    id:                  row.id as number,
    slug:                row.slug as string,
    nome:                row.nome as string,
    pack:                row.pack as Campaign['pack'],
    dono:                row.dono as string,
    tipo:                row.tipo as string,
    mes:                 row.mes as string,
    dataInsta:           row.data_insta as string,
    dataSite:            row.data_site as string,
    dataComercial:       row.data_comercial as string,
    dataFinal:           row.data_final as string,
    previsao:            row.previsao as string,
    launched:            row.launched as boolean,
    progresso:           row.progresso as number,
    colecaoId:           (row.colecao_id as number | null) ?? null,
    brainstormDate:      row.brainstorm_date as string | undefined,
    brainstormDone:      (row.brainstorm_done as boolean) ?? false,
    aprovComercialDate:  row.aprov_comercial_date as string | undefined,
    aprovComercialDone:  (row.aprov_comercial_done as boolean) ?? false,
    shootingDate:        row.shooting_date as string | undefined,
    shootingDone:        (row.shooting_done as boolean) ?? false,
  }
}

export function campaignToDb(c: Campaign): Record<string, unknown> {
  return {
    slug:                c.slug,
    nome:                c.nome,
    pack:                c.pack,
    dono:                c.dono,
    tipo:                c.tipo,
    mes:                 c.mes,
    data_insta:          c.dataInsta,
    data_site:           c.dataSite,
    data_comercial:      c.dataComercial,
    data_final:          c.dataFinal,
    previsao:            c.previsao,
    launched:            c.launched,
    progresso:           c.progresso,
    colecao_id:          c.colecaoId ?? null,
    brainstorm_date:     c.brainstormDate ?? null,
    brainstorm_done:     c.brainstormDone ?? false,
    aprov_comercial_date: c.aprovComercialDate ?? null,
    aprov_comercial_done: c.aprovComercialDone ?? false,
    shooting_date:       c.shootingDate ?? null,
    shooting_done:       c.shootingDone ?? false,
  }
}

// ─── Collection ──────────────────────────────────────────────

export function dbToCollection(row: Record<string, unknown>): Collection {
  return {
    id:            row.id as number,
    nome:          row.nome as string,
    tipo:          row.tipo as string,
    mes:           row.mes as string,
    dataSite:      row.data_site as string,
    dataMarketing: row.data_marketing as string,
    confirmado:    row.confirmado as string,
    launched:      row.launched as boolean,
    campaignId:    (row.campaign_id as number | null) ?? null,
    ilustra:       row.ilustra as Collection['ilustra'],
    marketing:     row.marketing as Collection['marketing'],
  }
}

export function collectionToDb(c: Collection): Record<string, unknown> {
  return {
    nome:           c.nome,
    tipo:           c.tipo,
    mes:            c.mes,
    data_site:      c.dataSite,
    data_marketing: c.dataMarketing,
    confirmado:     c.confirmado,
    launched:       c.launched,
    campaign_id:    c.campaignId ?? null,
    ilustra:        c.ilustra,
    marketing:      c.marketing,
  }
}

// ─── EventDate ───────────────────────────────────────────────

export function dbToEventDate(row: Record<string, unknown>): EventDate {
  return {
    id:       row.id as number,
    type:     row.type as string,
    name:     row.name as string,
    start:    row.start_date as string,
    end:      row.end_date as string,
    pack:     row.pack as EventDate['pack'],
    potencial: row.potencial as boolean,
    postado:  row.postado as boolean,
    format:   row.format as string,
  }
}

export function eventDateToDb(e: EventDate): Record<string, unknown> {
  return {
    type:       e.type,
    name:       e.name,
    start_date: e.start,
    end_date:   e.end,
    pack:       e.pack,
    potencial:  e.potencial,
    postado:    e.postado,
    format:     e.format,
  }
}

// ─── FutebolEvent ────────────────────────────────────────────

export function dbToFutebolEvent(row: Record<string, unknown>): FutebolEvent {
  return {
    id:   row.id as number,
    type: (row.type as string) ?? 'jogo',
    name: (row.name as string) ?? '',
    date: (row.date as string) ?? '',
  }
}

export function futebolEventToDb(e: FutebolEvent): Record<string, unknown> {
  return { type: e.type, name: e.name, date: e.date }
}

// ─── Live ─────────────────────────────────────────────────────

export function dbToLive(row: Record<string, unknown>): Live {
  return {
    id:           String(row.id),
    date:         (row.date as string) ?? '',
    diaSemana:    (row.dia_semana as string) ?? '',
    cupomLigado:  (row.cupom_ligado as boolean) ?? true,
    criativo:     (row.criativo as boolean) ?? false,
    merchan1:     (row.merchan1 as string) ?? '',
    nominal1:     (row.nominal1 as string) ?? '',
    receita1:     (row.receita1 as number) ?? 0,
    merchan2:     (row.merchan2 as string) ?? '',
    nominal2:     (row.nominal2 as string) ?? '',
    receita2:     (row.receita2 as number) ?? 0,
    cupomExtra:   (row.cupom_extra as string) ?? '',
    receitaExtra: (row.receita_extra as number) ?? 0,
    receitaTotal: (row.receita_total as number) ?? 0,
    receitaUtm:   (row.receita_utm as number) ?? 0,
    alcance:      (row.alcance as number) ?? 0,
    linkUtm:      (row.link_utm as string) ?? '',
    utmCampaign:  (row.utm_campaign as string) ?? '',
    status:       ((row.status as string) ?? 'proposta') as LiveStatus,
    origem:       (row.origem as string) ?? '',
    notes:        (row.notes as string) ?? '',
  }
}

export function liveToDb(l: Omit<Live, 'id'>): Record<string, unknown> {
  return {
    date:          l.date,
    dia_semana:    l.diaSemana,
    cupom_ligado:  l.cupomLigado,
    criativo:      l.criativo,
    merchan1:      l.merchan1,
    nominal1:      l.nominal1,
    receita1:      l.receita1,
    merchan2:      l.merchan2 || null,
    nominal2:      l.nominal2 || null,
    receita2:      l.receita2 || 0,
    cupom_extra:   l.cupomExtra || null,
    receita_extra: l.receitaExtra || 0,
    receita_total: l.receitaTotal,
    receita_utm:   l.receitaUtm || 0,
    alcance:       l.alcance || 0,
    link_utm:      l.linkUtm || null,
    utm_campaign:  l.utmCampaign || null,
    status:        l.status,
    origem:        l.origem || null,
    notes:         l.notes || null,
  }
}

// ─── Merchan ──────────────────────────────────────────────────

export function dbToMerchan(row: Record<string, unknown>): Merchan {
  const nome = (row.nome as string) ?? ''
  return {
    id:            String(row.id),
    nome,
    name:          nome,
    ativo:         (row.ativo as boolean) ?? true,
    forte:         (row.forte as boolean) ?? false,
    sempreSozinho: (row.sempre_sozinho as boolean) ?? false,
    color:         colorFromName(nome),
    short:         shortLabel(nome),
  }
}

export function merchanToDb(m: Merchan): Record<string, unknown> {
  return {
    nome:           m.nome,
    ativo:          m.ativo,
    forte:          m.forte,
    sempre_sozinho: m.sempreSozinho,
  }
}
