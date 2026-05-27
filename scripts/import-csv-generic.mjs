/**
 * Importador genérico de CSV → SQL INSERT para as tabelas:
 *   branding_posts, tiktok_posts, twitter_posts, canal_posts, copa_posts
 *
 * Uso:
 *   node scripts/import-csv-generic.mjs <tabela> "caminho/para/arquivo.csv" > output.sql
 *
 * Exemplos:
 *   node scripts/import-csv-generic.mjs branding_posts "supabase_import/calendario - BRANDING.csv" > branding_import.sql
 *   node scripts/import-csv-generic.mjs tiktok_posts   "supabase_import/calendario - TIKTOK.csv"   > tiktok_import.sql
 *   node scripts/import-csv-generic.mjs twitter_posts  "supabase_import/calendario - TWITTER.csv"  > twitter_import.sql
 *   node scripts/import-csv-generic.mjs canal_posts    "supabase_import/calendario - CANAL DE TRANSMISSÃO.csv" > canal_import.sql
 *   node scripts/import-csv-generic.mjs copa_posts     "supabase_import/calendario - COPA.csv"     > copa_import.sql
 *
 * Depois rode o SQL gerado no Supabase SQL Editor.
 *
 * Estrutura esperada do CSV (1 linha de cabeçalho):
 *   CALENDÁRIO, DONO, MÊS, DATA POST, HORÁRIO, TÍTULO, FORMATO, PLATAFORMA,
 *   PRODUTO, CAMPANHA, TAG, REF, STATUS, LINK (DO POST), OBS,
 *   PRAZO DE ENTREGA, LEGENDA, LINK DO VIDEO, LINK DA CAPA
 */

import { readFileSync, writeFileSync } from 'fs'

const VALID_TABLES = ['branding_posts', 'tiktok_posts', 'twitter_posts', 'canal_posts', 'copa_posts']

const tableName = process.argv[2]
const csvPath   = process.argv[3]
const outPath   = process.argv[4] // opcional: caminho do arquivo de saída

if (!tableName || !csvPath) {
  console.error('Uso: node scripts/import-csv-generic.mjs <tabela> "arquivo.csv" [saida.sql]')
  console.error('Tabelas válidas:', VALID_TABLES.join(', '))
  process.exit(1)
}
if (!VALID_TABLES.includes(tableName)) {
  console.error(`Tabela inválida: "${tableName}". Use uma de: ${VALID_TABLES.join(', ')}`)
  process.exit(1)
}

// ─── Plataforma padrão por tabela ─────────────────────────────
const DEFAULT_PLATFORM = {
  branding_posts: 'ig',
  tiktok_posts:   'tiktok',
  twitter_posts:  'twitter',
  canal_posts:    'canal',
  copa_posts:     'ig',
}

// ─── Helpers ──────────────────────────────────────────────────

function parseDate(ddmm) {
  if (!ddmm || ddmm.trim() === '') return null
  // Aceita dd/mm ou d/m
  const clean = ddmm.trim().replace(/h\d+/i, '').trim()
  const [d, m] = clean.split('/')
  if (!d || !m) return null
  const dd = d.replace(/\D/g, '')
  const mm = m.replace(/\D/g, '')
  if (!dd || !mm) return null
  return `2026-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function parseTime(col) {
  if (!col || col.trim() === '') return null
  // Aceita HH:MM, HHhMM, HH:MM:SS
  return col.trim().replace(/h/i, ':').replace(/:\d\d$/, '').slice(0, 5) || null
}

function mapStatus(statusCol) {
  const s = (statusCol || '').trim().toLowerCase()
  if (s === 'postado' || s === 'publicado') return 'pub'
  if (s === 'em pauta')  return 'pauta'
  if (s === 'entregue')  return 'entregue'
  if (s === 'agendado')  return 'sched'
  return 'prod'
}

function mapPlatform(platformCol, defaultPlatform) {
  const p = (platformCol || '').trim().toLowerCase()
  if (p === 'instagram') return 'ig'
  if (p === 'tiktok')    return 'tiktok'
  if (p === 'twitter')   return 'twitter'
  if (p.includes('canal')) return 'canal'
  return defaultPlatform
}

function csvParse(text) {
  text = text.replace(/^﻿/, '') // remove BOM
  const lines = text.split(/\r?\n/)
  const rows = []
  for (const line of lines) {
    if (!line.trim()) continue
    const cols = []
    let inQuote = false
    let cur = ''
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"' && !inQuote) { inQuote = true; continue }
      if (ch === '"' && inQuote) {
        if (line[i + 1] === '"') { cur += '"'; i++; continue }
        inQuote = false; continue
      }
      if (ch === ',' && !inQuote) { cols.push(cur); cur = ''; continue }
      cur += ch
    }
    cols.push(cur)
    rows.push(cols)
  }
  return rows
}

function esc(s) {
  if (s === null || s === undefined || s === '') return 'NULL'
  return `'${String(s).replace(/'/g, "''")}'`
}

function escTags(tagStr) {
  if (!tagStr || tagStr.trim() === '') return "ARRAY[]::text[]"
  return `ARRAY[${esc(tagStr.trim())}]`
}

// ─── Leitura e parsing ────────────────────────────────────────

const text = readFileSync(csvPath, 'utf-8')
const rows = csvParse(text)

// Pula a primeira linha (cabeçalho)
const dataRows = rows.slice(1)

const defaultPlatform = DEFAULT_PLATFORM[tableName]
const inserts = []

for (const row of dataRows) {
  // Colunas do CSV:
  // 0: CALENDÁRIO, 1: DONO, 2: MÊS, 3: DATA POST, 4: HORÁRIO,
  // 5: TÍTULO, 6: FORMATO, 7: PLATAFORMA, 8: PRODUTO, 9: CAMPANHA,
  // 10: TAG, 11: REF, 12: STATUS, 13: LINK (DO POST), 14: OBS,
  // 15: PRAZO DE ENTREGA, 16: LEGENDA, 17: LINK DO VIDEO, 18: LINK DA CAPA
  const owner      = (row[1]  || '').trim() || 'Social'
  const monthRaw   = (row[2]  || '').trim()
  const dateRaw    = (row[3]  || '').trim()
  const timeRaw    = (row[4]  || '').trim()
  const title      = (row[5]  || '').trim()
  const format     = (row[6]  || '').trim()
  const platformRaw= (row[7]  || '').trim()
  const product    = (row[8]  || '').trim()
  const campaign   = (row[9]  || '').trim()
  const tag        = (row[10] || '').trim()
  const ref        = (row[11] || '').trim()
  const statusRaw  = (row[12] || '').trim()
  const link       = (row[13] || '').trim()
  const obs        = (row[14] || '').trim()
  const deadline   = (row[15] || '').trim()
  const caption    = (row[16] || '').trim()
  const videoLink  = (row[17] || '').trim()
  const coverLink  = (row[18] || '').trim()

  if (!title) continue       // pula linhas sem título
  if (!dateRaw) continue     // pula linhas sem data

  const date     = parseDate(dateRaw)
  if (!date) continue

  const time     = parseTime(timeRaw)
  const month    = parseInt(monthRaw, 10) || null
  const status   = mapStatus(statusRaw)
  // Para tabelas com plataforma fixa (tiktok, twitter, canal), ignora a coluna do CSV
  const FIXED_PLATFORM = ['tiktok_posts', 'twitter_posts', 'canal_posts']
  const platform = FIXED_PLATFORM.includes(tableName) ? defaultPlatform : mapPlatform(platformRaw, defaultPlatform)

  inserts.push(
    `INSERT INTO ${tableName} ` +
    `(owner, month, date, time, title, format, platform, product, campaign, tags, ref, status, link, obs, deadline, caption, video_link, cover_link) VALUES (` +
    `${esc(owner)}, ${month ?? 'NULL'}, ${esc(date)}, ${esc(time)}, ${esc(title)}, ` +
    `${esc(format)}, ${esc(platform)}, ${esc(product)}, ${esc(campaign)}, ${escTags(tag)}, ` +
    `${esc(ref)}, ${esc(status)}, ${esc(link)}, ${esc(obs)}, ${esc(deadline)}, ` +
    `${esc(caption)}, ${esc(videoLink)}, ${esc(coverLink)});`
  )
}

// ─── Output ───────────────────────────────────────────────────
const lines = [
  `-- Importação: ${tableName}`,
  `-- Arquivo: ${csvPath}`,
  `-- Gerado em: ${new Date().toISOString()}`,
  '',
  `DELETE FROM ${tableName};`,
  '',
  'BEGIN;',
  '',
  ...inserts,
  '',
  'COMMIT;',
  `-- Total: ${inserts.length} posts inseridos`,
]
const output = lines.join('\n')

if (outPath) {
  writeFileSync(outPath, output, 'utf8')
  console.error(`✓ ${inserts.length} posts → ${outPath}`)
} else {
  process.stdout.write(output + '\n')
}
