/**
 * upsert-posts.mjs
 *
 * Lê posts.csv e faz upsert na tabela `posts` do Supabase.
 * Chave de correspondência: (title, platform, date, time)
 *   - Post encontrado → atualiza campos alterados
 *   - Post não encontrado → insere novo
 *
 * Uso:
 *   node scripts/upsert-posts.mjs posts.csv
 *
 * Variáveis de ambiente necessárias (lidas do .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← precisa da service role para bypass de RLS
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Carrega .env.local ────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
// Força leitura direta do arquivo para evitar conflito com dotenvx
const envPath = resolve(__dirname, '../.env.local')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // silencia erro de leitura
}

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
// Prefira SUPABASE_SERVICE_ROLE_KEY (bypassa RLS).
// Se não tiver, cai para a anon key — nesse caso o upsert só funciona
// se as policies de RLS permitirem INSERT/UPDATE para o role anon.
const SUPABASE_KEY  =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Defina NEXT_PUBLIC_SUPABASE_URL e (idealmente) SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Lê o CSV ─────────────────────────────────────────────────
const csvPath = process.argv[2]
if (!csvPath) {
  console.error('❌  Informe o caminho do CSV: node scripts/upsert-posts.mjs posts.csv')
  process.exit(1)
}

const raw = readFileSync(csvPath, 'utf-8')

const rows = parse(raw, {
  columns: true,          // primeira linha = cabeçalho
  skip_empty_lines: true,
  trim: true,
  relax_column_count: true,
})

// ── Mapeamento de campos CSV → DB ─────────────────────────────
function toDbRow(r) {
  // tags: "MH|Copa" → ['MH','Copa']  /  "MH" → ['MH']  /  "" → []
  const tagsRaw = r.tags || ''
  const tags = tagsRaw
    ? tagsRaw.split('|').map(t => t.trim()).filter(Boolean)
    : []

  // complexity: string → int
  const complexity = r.complexity ? parseInt(r.complexity, 10) : null

  // str: campos NOT NULL no banco → nunca envia null, usa ''
  const str = v => (v == null || v === '' ? '' : String(v).trim())

  return {
    title:      str(r.title),
    owner:      str(r.owner),
    platform:   str(r.platform),
    date:       str(r.date),
    time:       str(r.time),
    status:     str(r.status),
    complexity: isNaN(complexity) ? null : complexity,
    type:       str(r.type),
    tags,
    linha:      str(r.linha),
    campanha:   str(r.campanha),
    link:       str(r.link),
    ref:        str(r.ref),
    notes:      str(r.notes),
    caption:    str(r.caption),
    product:    str(r.product),
  }
}

// ── Lógica de upsert ──────────────────────────────────────────
async function run() {
  // 1. Busca todos os posts existentes (apenas campos da chave)
  const { data: existing, error: fetchErr } = await supabase
    .from('posts')
    .select('id, title, platform, date, time')

  if (fetchErr) {
    console.error('❌  Erro ao buscar posts existentes:', fetchErr.message)
    process.exit(1)
  }

  // Monta lookup: "title|platform|date|time" → id
  const lookup = new Map()
  for (const p of existing) {
    const key = makeKey(p.title, p.platform, p.date, p.time)
    lookup.set(key, p.id)
  }

  console.log(`📊  Posts existentes no banco: ${existing.length}`)
  console.log(`📄  Linhas no CSV: ${rows.length}`)

  const toInsert = []
  const toUpdate = []

  for (const r of rows) {
    const db = toDbRow(r)
    const key = makeKey(db.title, db.platform, db.date, db.time)
    const existingId = lookup.get(key)

    if (existingId != null) {
      toUpdate.push({ id: existingId, ...db })
    } else {
      toInsert.push(db)
    }
  }

  console.log(`\n🆕  Novos posts a inserir:  ${toInsert.length}`)
  console.log(`✏️   Posts a atualizar:       ${toUpdate.length}`)

  // 2. Insere novos em lotes de 100
  let insertedCount = 0
  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100)
    const { error } = await supabase.from('posts').insert(batch)
    if (error) {
      console.error(`❌  Erro ao inserir lote ${i / 100 + 1}:`, error.message)
    } else {
      insertedCount += batch.length
      process.stdout.write(`\r   Inseridos: ${insertedCount}/${toInsert.length}`)
    }
  }
  if (toInsert.length) console.log()

  // 3. Atualiza existentes em lotes de 50 (cada update é individual)
  let updatedCount = 0
  let errorCount = 0
  for (const post of toUpdate) {
    const { id, ...fields } = post
    const { error } = await supabase.from('posts').update(fields).eq('id', id)
    if (error) {
      errorCount++
      console.error(`\n❌  Erro ao atualizar id=${id}:`, error.message)
    } else {
      updatedCount++
    }
    if (updatedCount % 50 === 0) {
      process.stdout.write(`\r   Atualizados: ${updatedCount}/${toUpdate.length}`)
    }
  }
  if (toUpdate.length) console.log()

  console.log('\n✅  Concluído!')
  console.log(`   Inseridos: ${insertedCount}`)
  console.log(`   Atualizados: ${updatedCount}`)
  if (errorCount) console.log(`   Erros: ${errorCount}`)
}

function makeKey(title, platform, date, time) {
  return `${(title || '').trim()}|${platform || ''}|${date || ''}|${time || ''}`
}

run().catch(err => {
  console.error('❌  Erro inesperado:', err)
  process.exit(1)
})
