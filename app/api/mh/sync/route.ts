import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DROPBOX_TOKEN = process.env.DROPBOX_ACCESS_TOKEN!

// Mapeamento owner (nome no post) → pasta no Dropbox
const OWNER_TO_DROPBOX: Record<string, string> = {
  carina:    '/Creators/Carina',
  rebeca:    '/Creators/Rebeca',
  tha:       '/Creators/Tha',
  marina:    '/Creators/Marina',
  reciclado: '/Creators/Reciclado',
}

function ownerToPath(owner: string): string | null {
  return OWNER_TO_DROPBOX[owner.toLowerCase()] ?? null
}

async function folderHasFiles(path: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DROPBOX_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, limit: 1 }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      // Pasta não existe → sem entrega
      if ((err as { error_summary?: string }).error_summary?.startsWith('path/not_found')) return false
      return false
    }
    const data = await res.json() as { entries: unknown[] }
    return data.entries.length > 0
  } catch {
    return false
  }
}

export async function POST() {
  if (!DROPBOX_TOKEN) {
    return NextResponse.json({ error: 'DROPBOX_ACCESS_TOKEN não configurado' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 1. Buscar todos os mh_posts com status = 'pauta'
  const { data: posts, error } = await supabase
    .from('mh_posts')
    .select('id, owner, semana')
    .eq('status', 'pauta')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ updated: 0, creators: [] })
  }

  // 2. Agrupar por (owner, semana)
  const groups = new Map<string, { owner: string; semana: number; ids: string[] }>()
  for (const p of posts as { id: string; owner: string; semana: number }[]) {
    if (!p.semana) continue
    const key = `${p.owner.toLowerCase()}::${p.semana}`
    if (!groups.has(key)) groups.set(key, { owner: p.owner, semana: p.semana, ids: [] })
    groups.get(key)!.ids.push(p.id)
  }

  // 3. Verificar cada pasta no Dropbox
  const results: { name: string; semana: number; count: number }[] = []
  let totalUpdated = 0

  for (const { owner, semana, ids } of groups.values()) {
    const basePath = ownerToPath(owner)
    if (!basePath) continue

    const folderPath = `${basePath}/SEMANA ${semana}`
    const hasFiles = await folderHasFiles(folderPath)
    if (!hasFiles) continue

    // 4. Atualizar no Supabase
    const { error: updateErr } = await supabase
      .from('mh_posts')
      .update({ status: 'entregue', dropbox_link: folderPath })
      .in('id', ids)

    if (!updateErr) {
      totalUpdated += ids.length
      results.push({ name: owner, semana, count: ids.length })
    }
  }

  return NextResponse.json({ updated: totalUpdated, creators: results })
}
