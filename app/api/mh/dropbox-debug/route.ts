import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const result: Record<string, unknown> = {}

  // 1. Verifica variáveis de ambiente
  result.env = {
    DROPBOX_REFRESH_TOKEN: process.env.DROPBOX_REFRESH_TOKEN ? '✓ presente' : '✗ ausente',
    DROPBOX_CLIENT_ID:     process.env.DROPBOX_CLIENT_ID     ? '✓ presente' : '✗ ausente',
    DROPBOX_CLIENT_SECRET: process.env.DROPBOX_CLIENT_SECRET ? '✓ presente' : '✗ ausente',
  }

  // 2. Tenta obter access token
  let token: string | null = null
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
    const data = await res.json() as Record<string, unknown>
    if (data.access_token) {
      token = data.access_token as string
      result.token = '✓ obtido com sucesso'
    } else {
      result.token = `✗ erro: ${JSON.stringify(data)}`
    }
  } catch (e) {
    result.token = `✗ exceção: ${String(e)}`
  }

  // 3. Testa listagem de pasta da Rebeca (semana atual)
  if (token) {
    const testPath = '/MKT SOCIAL/CREATORS/REBECA'
    try {
      const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: testPath, limit: 10 }),
      })
      const data = await res.json() as Record<string, unknown>
      result.dropbox_rebeca_root = {
        status: res.status,
        entries: (data.entries as { name: string }[] | undefined)?.map(e => e.name) ?? data,
      }
    } catch (e) {
      result.dropbox_rebeca_root = `✗ exceção: ${String(e)}`
    }
  }

  // 4. Mostra posts "Em pauta" no banco
  try {
    const supabase = await createClient()
    const { data: posts, error } = await supabase
      .from('mh_posts')
      .select('id, owner, semana, status')
      .eq('status', 'pauta')
    result.posts_em_pauta = error ? `✗ ${error.message}` : posts
  } catch (e) {
    result.posts_em_pauta = `✗ exceção: ${String(e)}`
  }

  return NextResponse.json(result, { status: 200 })
}
