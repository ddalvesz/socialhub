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

async function folderHasFiles(token: string, path: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, limit: 1 }),
    })
    if (!res.ok) return false
    const data = await res.json() as { entries?: unknown[] }
    return Array.isArray(data.entries) && data.entries.length > 0
  } catch {
    return false
  }
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
    .select('id, owner, semana')
    .eq('status', 'pauta')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!posts?.length) return NextResponse.json({ updated: [] })

  // Agrupa por (owner, semana) — uma pasta por grupo
  const groups = new Map<string, { owner: string; semana: number; ids: string[] }>()
  for (const p of posts) {
    if (!p.owner || !p.semana) continue
    const key = `${p.owner}|||${p.semana}`
    if (!groups.has(key)) groups.set(key, { owner: p.owner as string, semana: p.semana as number, ids: [] })
    groups.get(key)!.ids.push(String(p.id))
  }

  const updatedIds: string[] = []
  for (const { owner, semana, ids } of groups.values()) {
    const folderPath = `/MKT SOCIAL/CREATORS/${owner.toUpperCase()}/Semana ${semana}`
    const hasFiles = await folderHasFiles(token, folderPath)
    if (!hasFiles) continue

    const { error: upErr } = await supabase
      .from('mh_posts')
      .update({ status: 'entregue', dropbox_link: folderPath })
      .in('id', ids)

    if (!upErr) updatedIds.push(...ids)
  }

  return NextResponse.json({ updated: updatedIds })
}
