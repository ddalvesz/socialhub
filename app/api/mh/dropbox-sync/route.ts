import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: process.env.DROPBOX_REFRESH_TOKEN!,
        client_id:     process.env.DROPBOX_CLIENT_ID!,
        client_secret: process.env.DROPBOX_CLIENT_SECRET!,
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { access_token?: string }
    return data.access_token ?? null
  } catch {
    return null
  }
}

function dropboxHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
  const ns = process.env.DROPBOX_NAMESPACE_ID
  if (ns) headers['Dropbox-API-Path-Root'] = JSON.stringify({ '.tag': 'namespace_id', namespace_id: ns })
  return headers
}

interface DropboxEntry {
  '.tag': string
  name: string
  path_lower: string
}

async function listFolder(token: string, path: string): Promise<DropboxEntry[]> {
  try {
    const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: dropboxHeaders(token),
      body: JSON.stringify({ path, limit: 100 }),
    })
    if (!res.ok) return []
    const data = await res.json() as { entries?: DropboxEntry[] }
    return data.entries ?? []
  } catch {
    return []
  }
}

// Retorna o link de compartilhamento de um arquivo (cria se não existir)
async function getShareLink(token: string, path: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
      method: 'POST',
      headers: dropboxHeaders(token),
      body: JSON.stringify({ path }),
    })
    const data = await res.json() as { url?: string; error_summary?: string; shared_link_already_exists?: { metadata?: { url?: string } } }

    if (data.url) return data.url

    // Link já existe — o Dropbox retorna o link existente no erro
    if (data.error_summary?.startsWith('shared_link_already_exists')) {
      return data.shared_link_already_exists?.metadata?.url ?? null
    }
    return null
  } catch {
    return null
  }
}

// Padrão esperado:
//   "VIDEO 1 - COM TEXTO"  → { num: 1, type: 'video' }
//   "VIDEO 1 - CAPA"       → { num: 1, type: 'capa' }
// Case-insensitive, aceita acento ou não em VÍDEO
function parseFileName(name: string): { num: number; type: 'video' | 'capa' } | null {
  const re = /^v[íi]deo\s+(\d+)\s*-\s*(.+?)(\.[^.]+)?$/i
  const match = re.exec(name)
  if (!match) return null
  const num = Number(match[1])
  const suffix = match[2].trim().toLowerCase()
  if (suffix === 'capa') return { num, type: 'capa' }
  if (suffix === 'com texto') return { num, type: 'video' }
  return null
}

export async function POST() {
  const missing = ['DROPBOX_REFRESH_TOKEN', 'DROPBOX_CLIENT_ID', 'DROPBOX_CLIENT_SECRET']
    .filter(k => !process.env[k])
  if (missing.length) {
    return NextResponse.json({ error: `Variáveis não configuradas: ${missing.join(', ')}` }, { status: 500 })
  }

  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ error: 'Não foi possível obter access token do Dropbox' }, { status: 500 })
  }

  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('mh_posts')
    .select('id, owner, semana, num_video')
    .eq('status', 'pauta')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!posts?.length) return NextResponse.json({ updated: [] })

  // Agrupa por (owner, semana) — uma chamada de listFolder por grupo
  type PostRow = { id: string; owner: string; semana: number; num_video: number }
  const groups = new Map<string, { owner: string; semana: number; posts: PostRow[] }>()
  for (const p of posts) {
    if (!p.owner || !p.semana || !p.num_video) continue
    const key = `${p.owner}|||${p.semana}`
    if (!groups.has(key)) groups.set(key, { owner: p.owner as string, semana: p.semana as number, posts: [] })
    groups.get(key)!.posts.push(p as PostRow)
  }

  type UpdatedPost = { id: string; dropboxLink: string; videoLink: string | null; coverLink: string | null }
  const updatedPosts: UpdatedPost[] = []

  for (const { owner, semana, posts: groupPosts } of groups.values()) {
    const folderPath = `/MKT SOCIAL/CREATORS/${owner.toUpperCase()}/Semana ${semana}`
    const entries = await listFolder(token, folderPath)
    if (!entries.length) continue

    // Mapeia numVideo → { videoPath, capaPath } com base nos arquivos encontrados
    const videoFiles = new Map<number, { videoPath?: string; capaPath?: string }>()
    for (const entry of entries) {
      if (entry['.tag'] !== 'file') continue
      const parsed = parseFileName(entry.name)
      if (!parsed) continue
      if (!videoFiles.has(parsed.num)) videoFiles.set(parsed.num, {})
      const slot = videoFiles.get(parsed.num)!
      if (parsed.type === 'video') slot.videoPath = entry.path_lower
      if (parsed.type === 'capa')  slot.capaPath  = entry.path_lower
    }

    for (const post of groupPosts) {
      const files = videoFiles.get(post.num_video)
      // Só marca entregue se encontrou ao menos o arquivo de vídeo
      if (!files?.videoPath) continue

      const [videoLink, capaLink] = await Promise.all([
        getShareLink(token, files.videoPath),
        files.capaPath ? getShareLink(token, files.capaPath) : Promise.resolve(null),
      ])

      const { error: upErr } = await supabase
        .from('mh_posts')
        .update({
          status:       'entregue',
          dropbox_link: folderPath,
          video_link:   videoLink  ?? undefined,
          cover_link:   capaLink   ?? undefined,
        })
        .eq('id', post.id)

      if (!upErr) updatedPosts.push({ id: String(post.id), dropboxLink: folderPath, videoLink, coverLink: capaLink })
    }
  }

  return NextResponse.json({ updated: updatedPosts })
}
