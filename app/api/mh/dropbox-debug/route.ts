import { NextResponse } from 'next/server'

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
    const data = await res.json() as { access_token?: string }
    return data.access_token ?? null
  } catch { return null }
}

async function listFolder(token: string, path: string, namespaceId?: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
  if (namespaceId) {
    headers['Dropbox-API-Path-Root'] = JSON.stringify({ '.tag': 'namespace_id', namespace_id: namespaceId })
  }
  const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers,
    body: JSON.stringify({ path, limit: 10 }),
  })
  const data = await res.json() as Record<string, unknown>
  return { status: res.status, data }
}

export async function GET() {
  const result: Record<string, unknown> = {}

  // 1. Env vars
  result.env = {
    DROPBOX_REFRESH_TOKEN: process.env.DROPBOX_REFRESH_TOKEN ? '✓' : '✗ ausente',
    DROPBOX_CLIENT_ID:     process.env.DROPBOX_CLIENT_ID     ? '✓' : '✗ ausente',
    DROPBOX_CLIENT_SECRET: process.env.DROPBOX_CLIENT_SECRET ? '✓' : '✗ ausente',
    DROPBOX_NAMESPACE_ID:  process.env.DROPBOX_NAMESPACE_ID  ?? '(não configurado)',
  }

  // 2. Obter access token
  const token = await getAccessToken()
  result.token = token ? '✓ obtido' : '✗ falhou'
  if (!token) return NextResponse.json(result)

  // 3. Info da conta (pega namespace do team)
  try {
    const res = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: 'null',
    })
    const acc = await res.json() as Record<string, unknown>
    const team = acc.team as Record<string, unknown> | undefined
    result.account = {
      name: (acc.name as Record<string, unknown>)?.display_name,
      team_name: team?.name,
      root_info: acc.root_info,
    }
  } catch (e) { result.account = String(e) }

  // 4. Testa pasta sem namespace
  const testPath = '/MKT SOCIAL/CREATORS/REBECA'
  result.sem_namespace = await listFolder(token, testPath).catch(e => String(e))

  // 5. Testa pasta com namespace configurado (se existir)
  const nsId = process.env.DROPBOX_NAMESPACE_ID
  if (nsId) {
    result.com_namespace = await listFolder(token, testPath, nsId).catch(e => String(e))
  }

  // 6. Tenta achar namespace via root_namespace_id da conta
  const rootInfo = (result.account as Record<string, unknown>)?.root_info as Record<string, unknown> | undefined
  const rootNs = rootInfo?.root_namespace_id as string | undefined
  if (rootNs && rootNs !== nsId) {
    result.com_root_namespace = await listFolder(token, testPath, rootNs).catch(e => String(e))
    result.root_namespace_id = rootNs
  }

  return NextResponse.json(result, { status: 200 })
}
