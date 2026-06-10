import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Metricool CSV column headers (exact order from the template)
const HEADERS = [
  'Text','Date','Time','Draft','Facebook','Twitter/X','LinkedIn','GBP','Instagram',
  'Pinterest','TikTok','Youtube','Threads','Bluesky',
  'Picture Url 1','Picture Url 2','Picture Url 3','Picture Url 4','Picture Url 5',
  'Picture Url 6','Picture Url 7','Picture Url 8','Picture Url 9','Picture Url 10',
  'Alt text picture 1','Alt text picture 2','Alt text picture 3','Alt text picture 4',
  'Alt text picture 5','Alt text picture 6','Alt text picture 7','Alt text picture 8',
  'Alt text picture 9','Alt text picture 10',
  'Document title','Shortener','Video Thumbnail Url','Video Cover Frame',
  'Twitter/X Can reply','Twitter/X Type','Twitter/X Poll Duration minutes',
  'Twitter/X Poll Option 1','Twitter/X Poll Option 2','Twitter/X Poll Option 3','Twitter/X Poll Option 4',
  'Pinterest Board','Pinterest Pin Title','Pinterest Pin Link','Pinterest Pin New Format',
  'Instagram Post Type','Instagram Show Reel On Feed',
  'Youtube Video Title','Youtube Video Type','Youtube Video Privacy',
  'Youtube video for kids','Youtube Video Category','Youtube Video Tags','Youtube playlist',
  'GBP Post Type','Facebook Post Type','Facebook Title','First Comment Text',
  'TikTok Title','TikTok disable comments','TikTok disable duet','TikTok disable stitch',
  'TikTok Post Privacy','TikTok Branded Content','TikTok Your Brand','TikTok Auto Add Music',
  'TikTok Photo Cover Index','TikTok musicId','TikTok music title','TikTok music author',
  'TikTok music previewUrl','TikTok music thumbnailUrl','TikTok music soundVolume',
  'TikTok music originalVolume','TikTok music startMillis','TikTok music endMillis',
  'TikTok Ai generated content',
  'LinkedIn Type','LinkedIn Poll Question','LinkedIn Poll Option 1','LinkedIn Poll Option 2',
  'LinkedIn Poll Option 3','LinkedIn Poll Option 4','LinkedIn Poll Duration',
  'LinkedIn Show link preview','LinkedIn Images as Carousel',
  'Threads Reply Control','Threads Is Spoiler','Threads Post Type','Brand name',
]

function csvCell(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value)
  // Wrap in quotes if it contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

// Raw DB row from calendar_posts view (snake_case columns)
type DbRow = Record<string, unknown>

function postToMetricoolRow(post: DbRow): string[] {
  const platform   = String(post.platform ?? '')
  const format     = String(post.format ?? '')
  const videoLink  = String(post.video_link ?? '')
  const coverLink  = String(post.cover_link ?? '')
  const slideLinks = (post.slide_links as string[] | null) ?? []
  const title      = String(post.title ?? '')

  const isIG      = platform === 'ig'
  const isTikTok  = platform === 'tiktok'
  const isTwitter = platform === 'twitter'
  const isYoutube = platform === 'youtube'

  // Instagram post type mapping
  let igPostType = ''
  if (isIG) {
    const fmtLower = format.toLowerCase()
    if (fmtLower === 'reels') igPostType = 'REEL'
    else if (fmtLower === 'story') igPostType = 'STORY'
    else igPostType = 'POST'
  }

  // YouTube video type mapping
  const ytVideoType = isYoutube ? (format === 'Shorts' ? 'SHORT' : 'VIDEO') : ''

  // Image URL mapping
  // - Video/Reels/TikTok/YouTube: videoLink in slot 1; coverLink as thumbnail
  // - Carousel: slideLinks fill slots 1-10; coverLink as fallback for slot 1
  // - Static/other: coverLink in slot 1
  const formatLower = format.toLowerCase()
  const isVideo = formatLower === 'reels' || formatLower === 'vídeo' || formatLower === 'video' || formatLower === 'shorts' || isYoutube || isTikTok
  let urls: string[]
  if (isVideo) {
    urls = videoLink ? [videoLink] : []
  } else if ((formatLower === 'carrossel' || formatLower === 'carousel') && slideLinks.length > 0) {
    urls = slideLinks
  } else {
    urls = coverLink ? [coverLink] : (videoLink ? [videoLink] : [])
  }
  const videoThumbnail = isVideo ? coverLink : ''

  const picUrls  = Array.from({ length: 10 }, (_, i) => urls[i] ?? '')
  const picAlts  = Array.from({ length: 10 }, () => '')

  // Draft = true only when status is 'prod' (still in production, not ready to publish)
  const isDraft = post.status === 'prod'

  // Time: convert HH:mm → HH:mm:ss
  const time = post.time ? `${post.time}:00` : '12:00:00'

  const row: (string | boolean | number) [] = [
    /* Text                      */ String(post.caption ?? ''),
    /* Date                      */ String(post.date ?? ''),
    /* Time                      */ time,
    /* Draft                     */ isDraft,
    /* Facebook                  */ false,
    /* Twitter/X                 */ isTwitter,
    /* LinkedIn                  */ false,
    /* GBP                       */ false,
    /* Instagram                 */ isIG,
    /* Pinterest                 */ false,
    /* TikTok                    */ isTikTok,
    /* Youtube                   */ isYoutube,
    /* Threads                   */ false,
    /* Bluesky                   */ false,
    /* Picture Url 1-10          */ ...picUrls,
    /* Alt text 1-10             */ ...picAlts,
    /* Document title            */ '',
    /* Shortener                 */ false,
    /* Video Thumbnail Url       */ videoThumbnail,
    /* Video Cover Frame         */ '',
    /* Twitter/X Can reply       */ '',
    /* Twitter/X Type            */ isTwitter ? 'POST' : '',
    /* Twitter/X Poll Duration   */ '',
    /* Twitter/X Poll Option 1-4 */ '', '', '', '',
    /* Pinterest Board           */ '',
    /* Pinterest Pin Title       */ '',
    /* Pinterest Pin Link        */ '',
    /* Pinterest Pin New Format  */ false,
    /* Instagram Post Type       */ igPostType,
    /* Instagram Show Reel Feed  */ isIG && formatLower === 'reels' ? true : '',
    /* Youtube Video Title       */ isYoutube ? title : '',
    /* Youtube Video Type        */ ytVideoType,
    /* Youtube Video Privacy     */ isYoutube ? 'PUBLIC' : '',
    /* Youtube for kids          */ false,
    /* Youtube Video Category    */ '',
    /* Youtube Video Tags        */ '',
    /* Youtube playlist          */ '',
    /* GBP Post Type             */ '',
    /* Facebook Post Type        */ '',
    /* Facebook Title            */ '',
    /* First Comment Text        */ '',
    /* TikTok Title              */ isTikTok ? title.slice(0, 90) : '',
    /* TikTok disable comments   */ false,
    /* TikTok disable duet       */ false,
    /* TikTok disable stitch     */ false,
    /* TikTok Post Privacy       */ isTikTok ? 'PUBLIC_TO_EVERYONE' : '',
    /* TikTok Branded Content    */ false,
    /* TikTok Your Brand         */ false,
    /* TikTok Auto Add Music     */ false,
    /* TikTok Photo Cover Index  */ '',
    /* TikTok musicId            */ '',
    /* TikTok music title        */ '',
    /* TikTok music author       */ '',
    /* TikTok music previewUrl   */ '',
    /* TikTok music thumbnailUrl */ '',
    /* TikTok music soundVolume  */ '',
    /* TikTok music originalVol  */ '',
    /* TikTok music startMillis  */ '',
    /* TikTok music endMillis    */ '',
    /* TikTok Ai generated       */ false,
    /* LinkedIn Type             */ '',
    /* LinkedIn Poll Question    */ '',
    /* LinkedIn Poll Option 1-4  */ '', '', '', '',
    /* LinkedIn Poll Duration    */ '',
    /* LinkedIn Show link preview*/ '',
    /* LinkedIn Images Carousel  */ '',
    /* Threads Reply Control     */ '',
    /* Threads Is Spoiler        */ '',
    /* Threads Post Type         */ '',
    /* Brand name                */ '',
  ]

  return row.map(v => csvCell(v))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from     = searchParams.get('from')
  const to       = searchParams.get('to')
  const platform = searchParams.get('platform') // optional filter

  if (!from || !to) {
    return NextResponse.json({ error: 'Parâmetros from e to são obrigatórios' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let query = supabase
    .from('calendar_posts')
    .select('*')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (platform && platform !== 'all') {
    query = query.eq('platform', platform)
  }

  const statusParam = searchParams.get('statuses')
  const statuses = statusParam ? statusParam.split(',') : ['sched']
  query = query.in('status', statuses)

  const { data: posts, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (posts as DbRow[]).map(postToMetricoolRow)
  const csv = [
    HEADERS.map(h => csvCell(h)).join(','),
    ...rows.map(r => r.join(',')),
  ].join('\r\n')

  const filename = `metricool-${from}-a-${to}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
