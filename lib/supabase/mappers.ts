import type { Brand, Campaign, CanalPost, Collection, DayAggregate, EventDate, FutebolEvent, Live, LiveStatus, Merchan, Post, PostSource, PostStatus, Platform, SiteLink, Story, StoryBeleza, StoryBelezaStatus, StoryStatus, TeamProfile } from '@/lib/types'
import { colorFromName, shortLabel } from '@/lib/livesUtils'

function normalizeTags(tags: string[]): string[] {
  return Array.isArray(tags) ? tags : []
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
    archived:          (row.archived as boolean) ?? false,
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
    archived:           p.archived ?? false,
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

export function dbToCanalPost(row: Record<string, unknown>): CanalPost {
  const tags = normalizeTags(row.tags as string[])
  return {
    id:        String(row.id),
    date:      (row.date as string) ?? '',
    time:      (row.time as string) ?? '',
    title:     (row.title as string) ?? '',
    content:   (row.caption as string) ?? '',
    tag:       tags[0] ?? '',
    campaign:  (row.campaign as string) ?? '',
    cupom:     (row.cupom as string) ?? '',
    cupomUtm:   (row.cupom_utm as string) ?? '',
    revenue:    row.revenue != null ? Number(row.revenue) : null,
    receitaUtm: row.receita_utm != null ? Number(row.receita_utm) : null,
    status:     (row.status as PostStatus) ?? 'prod',
    obs:        (row.obs as string) ?? '',
    owner:      (row.owner as string) ?? '',
    brand:      (row.brand as Brand) ?? 'gocase',
  }
}

export function canalPostToDb(p: CanalPost): Record<string, unknown> {
  return {
    id:          p.id,
    date:        p.date,
    time:        p.time || '',
    title:       p.title,
    caption:     p.content,
    tags:        p.tag ? [p.tag] : [],
    campaign:    p.campaign || null,
    cupom:       p.cupom || '',
    cupom_utm:   p.cupomUtm || '',
    revenue:     p.revenue ?? null,
    receita_utm: p.receitaUtm ?? null,
    status:      p.status,
    obs:         p.obs || '',
    owner:       p.owner || '',
    brand:       p.brand,
    archived:    false,
  }
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
    archived:            (row.archived as boolean) ?? false,
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
    archived:            c.archived ?? false,
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

// ─── Live ────────────────────────────────────────────────────

export function dbToLive(row: Record<string, unknown>): Live {
  return {
    id:           String(row.id),
    date:         (row.date as string) ?? '',
    hora:         (row.hora as string) ?? '',
    diaSemana:    (row.dia_semana as string) ?? '',
    cupomLigado:  (row.cupom_ligado as boolean) ?? true,
    criativo:     (row.criativo as string) ?? '',
    merchan1:     (row.merchan1 as string) ?? '',
    nominal1:     (row.nominal1 as string) ?? '',
    receita1:     Number(row.receita1 ?? 0),
    merchan2:     (row.merchan2 as string) ?? '',
    nominal2:     (row.nominal2 as string) ?? '',
    receita2:     Number(row.receita2 ?? 0),
    cupomExtra:   (row.cupom_extra as string) ?? '',
    receitaExtra: Number(row.receita_extra ?? 0),
    receitaTotal: Number(row.receita_total ?? 0),
    receitaUtm:   Number(row.receita_utm ?? 0),
    ordersCupom:  row.orders_cupom != null ? Number(row.orders_cupom) : null,
    ordersUtm:    row.orders_utm   != null ? Number(row.orders_utm)   : null,
    ordersTotal:  row.orders_total != null ? Number(row.orders_total) : null,
    alcance:      Number(row.alcance ?? 0),
    produto:      (row.produto as string) ?? '',
    linkUtm:      (row.link_utm as string) ?? '',
    utmCampaign:  (row.utm_campaign as string) ?? '',
    status:       ((row.status as string) ?? 'proposta') as LiveStatus,
    origem:       (row.origem as string) ?? 'manual',
    notes:        (row.notes as string) ?? '',
  }
}

export function liveToDb(l: Omit<Live, 'id'>): Record<string, unknown> {
  return {
    date:          l.date,
    hora:          l.hora || null,
    dia_semana:    l.diaSemana,
    cupom_ligado:  l.cupomLigado,
    criativo:      l.criativo,
    merchan1:      l.merchan1 || null,
    nominal1:      l.nominal1 || null,
    receita1:      l.receita1,
    merchan2:      l.merchan2 || null,
    nominal2:      l.nominal2 || null,
    receita2:      l.receita2,
    cupom_extra:   l.cupomExtra || null,
    receita_extra: l.receitaExtra,
    receita_total: l.receitaTotal,
    receita_utm:   l.receitaUtm,
    orders_cupom:  l.ordersCupom ?? null,
    orders_utm:    l.ordersUtm   ?? null,
    orders_total:  l.ordersTotal ?? null,
    alcance:       l.alcance || null,
    produto:       l.produto || null,
    link_utm:      l.linkUtm || null,
    utm_campaign:  l.utmCampaign || null,
    status:        l.status,
    origem:        l.origem,
    notes:         l.notes || null,
  }
}

// ─── Merchan ─────────────────────────────────────────────────

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

export function merchanToDb(m: Pick<Merchan, 'nome' | 'ativo' | 'forte' | 'sempreSozinho'>): Record<string, unknown> {
  return {
    nome:           m.nome,
    ativo:          m.ativo,
    forte:          m.forte,
    sempre_sozinho: m.sempreSozinho,
  }
}

// ─── Stories ─────────────────────────────────────────────────

function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function dbToStory(row: Record<string, unknown>): Story {
  const produto = (row.produto as string) ?? ''
  return {
    id:              String(row.id),
    date:            (row.date as string) ?? '',
    hora:            (row.hora as number) ?? 18,
    diaSemana:       (row.dia_semana as string) ?? '',
    utm:             (row.utm as string) ?? '',
    produto,
    produtoSlug:     slugify(produto),
    categoria:       (row.categoria as string) ?? '',
    status:          ((row.status as string) ?? 'nao_iniciado') as StoryStatus,
    linkMidia:       (row.link_midia as string) ?? null,
    linkUtm:         (row.link_utm as string) ?? null,
    rastreioReceita: (row.rastreio_receita as string) ?? null,
    receita:         (row.receita as number) ?? null,
    origem:          (row.origem as string) ?? 'manual',
  }
}

export function storyToDb(s: Omit<Story, 'id' | 'produtoSlug'>): Record<string, unknown> {
  return {
    date:             s.date,
    hora:             s.hora,
    dia_semana:       s.diaSemana,
    utm:              s.utm,
    produto:          s.produto,
    categoria:        s.categoria,
    status:           s.status,
    link_midia:       s.linkMidia,
    link_utm:         s.linkUtm,
    rastreio_receita: s.rastreioReceita,
    receita:          s.receita,
    origem:           s.origem,
  }
}

// ─── Stories Beleza ──────────────────────────────────────────

export function dbToStoryBeleza(row: Record<string, unknown>): StoryBeleza {
  return {
    id:              String(row.id),
    date:            (row.date as string) ?? '',
    hora:            (row.hora as number) ?? 12,
    cod:             (row.cod as string) ?? '',
    page:            (row.page as string) ?? '',
    merchant:        (row.merchant as string) ?? '',
    status:          ((row.status as string) ?? 'pendente') as StoryBelezaStatus,
    linkConteudo:    (row.link_conteudo as string) ?? null,
    linkCta:         (row.link_cta as string) ?? null,
    rastreioReceita: (row.rastreio_receita as string) ?? null,
    receita:         row.receita != null ? Number(row.receita) : null,
    marca:           (row.marca as Brand) ?? 'barbours',
    origem:          (row.origem as string) ?? 'manual',
  }
}

export function storyBelezaToDb(s: Omit<StoryBeleza, 'id'>): Record<string, unknown> {
  return {
    date:             s.date,
    hora:             s.hora,
    cod:              s.cod,
    page:             s.page,
    merchant:         s.merchant,
    status:           s.status,
    link_conteudo:    s.linkConteudo || null,
    link_cta:         s.linkCta || null,
    rastreio_receita: s.rastreioReceita || null,
    receita:          s.receita,
    marca:            s.marca,
    origem:           s.origem,
  }
}

// Adapta um row de stories_beleza para o tipo Story usado pela StoriesView
export function dbToStoryFromBeleza(row: Record<string, unknown>): Story {
  const belezaStatus = (row.status as string) ?? 'pendente'
  const storyStatus: StoryStatus =
    belezaStatus === 'postado'    ? 'postado'
    : belezaStatus === 'nao_postado' ? 'nao_postado'
    : 'nao_iniciado'
  const page     = (row.page as string) ?? ''
  const merchant = (row.merchant as string) ?? ''
  return {
    id:              String(row.id),
    date:            (row.date as string) ?? '',
    hora:            (row.hora as number) ?? 12,
    diaSemana:       '',
    utm:             (row.cod as string) ?? '',
    produto:         page,
    produtoSlug:     slugify(page),
    categoria:       merchant,
    status:          storyStatus,
    linkMidia:       (row.link_conteudo as string) ?? null,
    linkUtm:         (row.link_cta as string) ?? null,
    rastreioReceita: (row.rastreio_receita as string) ?? null,
    receita:         row.receita != null ? Number(row.receita) : null,
    origem:          (row.origem as string) ?? 'manual',
  }
}

// Converte Story de volta para o formato stories_beleza (usado no save)
export function storyToDbBeleza(s: Omit<Story, 'id' | 'produtoSlug'>, marca: Brand): Record<string, unknown> {
  const belezaStatus =
    s.status === 'postado'     ? 'postado'
    : s.status === 'nao_postado' ? 'nao_postado'
    : 'pendente'
  return {
    date:             s.date,
    hora:             s.hora,
    cod:              s.utm,
    page:             s.produto,
    merchant:         s.categoria,
    status:           belezaStatus,
    link_conteudo:    s.linkMidia || null,
    link_cta:         s.linkUtm || null,
    rastreio_receita: s.rastreioReceita || null,
    receita:          s.receita,
    marca,
    origem:           s.origem,
  }
}

// ─── Profile ─────────────────────────────────────────────────

export function dbToProfile(row: Record<string, unknown>): TeamProfile {
  const name    = (row.name as string) ?? ''
  const ownerId = (row.owner_id as string) || name.split(' ')[0] || (row.email as string)?.split('@')[0] || ''
  return {
    id:         ownerId,
    name,
    role:       (row.role as string) ?? '',
    email:      (row.email as string) ?? '',
    joined:     row.joined_at ? (row.joined_at as string).slice(0, 10) : '',
    color:      (row.color as string) ?? 'oklch(0.62 0.15 265)',
    initial:    (row.initial as string) || name.charAt(0).toUpperCase() || '',
    avatarUrl:  (row.avatar_url as string) || undefined,
    supabaseId: (row.id as string) ?? undefined,
  }
}

export function dbToDayAggregate(row: Record<string, unknown>): DayAggregate {
  return {
    id:                String(row.id),
    date:              (row.date as string) ?? '',
    alcance:           (row.alcance as number) ?? 0,
    visualizacoes:     (row.visualizacoes as number) ?? 0,
    respostas:         (row.respostas as number) ?? 0,
    compartilhamentos: (row.compartilhamentos as number) ?? 0,
    visitasPerfil:     (row.visitas_perfil as number) ?? 0,
  }
}

// ─── SiteLink ─────────────────────────────────────────────────

export function dbToSiteLink(row: Record<string, unknown>): SiteLink {
  return {
    id:        String(row.id),
    brand:     (row.brand as Brand),
    categoria: (row.categoria as string) ?? '',
    produto:   (row.produto as string) ?? '',
    link:      (row.link as string) ?? '',
  }
}

export function siteLinkToDb(sl: Omit<SiteLink, 'id'>): Record<string, unknown> {
  return {
    brand:     sl.brand,
    categoria: sl.categoria,
    produto:   sl.produto,
    link:      sl.link,
  }
}
