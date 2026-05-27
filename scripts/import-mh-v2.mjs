/**
 * Importador MH v2 → SQL INSERT para mh_posts
 *
 * Uso:
 *   node scripts/import-mh-v2.mjs "supabase_import/calendario - MH (1).csv" > mh_import.sql
 *
 * Estrutura do CSV (1 linha de cabeçalho):
 *   CALENDÁRIO, SEMANA, VÍDEO, DONO, MÊS, DATA POST, HORÁRIO, TÍTULO, FORMATO, PLATAFORMA,
 *   PRODUTO, CAMPANHA, TAG, REF, STATUS, LINK (DO POST), OBS,
 *   PRAZO DE ENTREGA, LEGENDA, LINK DO VIDEO, LINK DA CAPA
 */

import { readFileSync, writeFileSync } from 'fs'

const csvPath = process.argv[2]
const outPath = process.argv[3]
if (!csvPath) {
  console.error('Uso: node scripts/import-mh-v2.mjs "arquivo.csv" [saida.sql]')
  process.exit(1)
}

const OWNER_NORMALIZE = {
  'carina':  'Carina',
  'rebeca':  'Rebeca',
  'tha':     'Tha',
  'marina':  'Marina',
  'reciclado': 'Reciclado',
}

function parseDate(ddmm) {
  if (!ddmm || ddmm.trim() === '') return null
  const [d, m] = ddmm.trim().split('/')
  if (!d || !m) return null
  return `2026-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function parseTime(col) {
  if (!col || col.trim() === '') return null
  return col.trim().replace(/h/i, ':').slice(0, 5) || null
}

function mapStatus(statusCol) {
  const s = (statusCol || '').trim().toLowerCase()
  if (s === 'postado' || s === 'publicado') return 'pub'
  if (s === 'em pauta')  return 'pauta'
  if (s === 'entregue')  return 'entregue'
  if (s === 'agendado')  return 'sched'
  return 'prod'
}

function parseSemana(col) {
  if (!col || col.trim() === '') return null
  const s = col.trim().replace(/^SEMANA\s*/i, '')
  const n = parseInt(s, 10)
  return isNaN(n) ? null : n
}

function parseNumVideo(col) {
  if (!col || col.trim() === '') return null
  const s = col.trim().replace(/^v[íi]deo\s*/i, '')
  const n = parseInt(s, 10)
  return isNaN(n) ? null : n
}

function csvParse(text) {
  text = text.replace(/^﻿/, '')
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

const text = readFileSync(csvPath, 'utf-8')
const rows = csvParse(text)
const dataRows = rows.slice(1) // pula cabeçalho

// Rastreia semana/video por criador para linhas sem número
const semanaTracker = {}
const videoTracker  = {}

const inserts = []

for (const row of dataRows) {
  // Colunas do CSV MH (22 colunas):
  // 0: CALENDÁRIO, 1: SEMANA, 2: VÍDEO, 3: DONO, 4: MÊS,
  // 5: DATA POST, 6: HORÁRIO, 7: TÍTULO, 8: FORMATO, 9: PLATAFORMA,
  // 10: PRODUTO, 11: CAMPANHA, 12: TAG, 13: REF, 14: STATUS,
  // 15: LINK (DO POST), 16: OBS, 17: PRAZO DE ENTREGA,
  // 18: LEGENDA, 19: LINK DO VIDEO, 20: LINK DA CAPA
  const semanaRaw  = (row[1]  || '').trim()
  const videoRaw   = (row[2]  || '').trim()
  const ownerRaw   = (row[3]  || '').trim()
  const monthRaw   = (row[4]  || '').trim()
  const dateRaw    = (row[5]  || '').trim()
  const timeRaw    = (row[6]  || '').trim()
  const title      = (row[7]  || '').trim()
  const format     = (row[8]  || '').trim() || 'Reels'
  const platformRaw= (row[9]  || '').trim()
  const product    = (row[10] || '').trim()
  const campaign   = (row[11] || '').trim()
  const tag        = (row[12] || '').trim()
  const ref        = (row[13] || '').trim()
  const statusRaw  = (row[14] || '').trim()
  const link       = (row[15] || '').trim()
  const obs        = (row[16] || '').trim()
  const deadline   = (row[17] || '').trim()
  const caption    = (row[18] || '').trim()
  const videoLink  = (row[19] || '').trim()
  const coverLink  = (row[20] || '').trim()

  if (!title)   continue
  if (!dateRaw) continue

  const date = parseDate(dateRaw)
  if (!date) continue

  const ownerKey = ownerRaw.toLowerCase()
  const owner = OWNER_NORMALIZE[ownerKey] || ownerRaw
  if (!owner) continue

  const semana = parseSemana(semanaRaw) ?? (semanaTracker[ownerKey] || 1)
  semanaTracker[ownerKey] = semana

  let numVideo = parseNumVideo(videoRaw)
  if (!numVideo) {
    videoTracker[ownerKey] = videoTracker[ownerKey] || {}
    videoTracker[ownerKey][semana] = (videoTracker[ownerKey][semana] || 0) + 1
    numVideo = videoTracker[ownerKey][semana]
  } else {
    videoTracker[ownerKey] = videoTracker[ownerKey] || {}
    videoTracker[ownerKey][semana] = Math.max(videoTracker[ownerKey][semana] || 0, numVideo)
  }

  const time     = parseTime(timeRaw)
  const month    = parseInt(monthRaw, 10) || null
  const status   = mapStatus(statusRaw)
  const p = platformRaw.toLowerCase()
  const platform = p === 'tiktok' ? 'tiktok' : p === 'twitter' ? 'twitter' : 'ig'

  inserts.push(
    `INSERT INTO mh_posts ` +
    `(owner, month, date, time, title, format, platform, product, campaign, tags, ref, status, link, obs, deadline, caption, video_link, cover_link, semana, num_video) VALUES (` +
    `${esc(owner)}, ${month ?? 'NULL'}, ${esc(date)}, ${esc(time)}, ${esc(title)}, ` +
    `${esc(format)}, ${esc(platform)}, ${esc(product)}, ${esc(campaign)}, ${escTags(tag)}, ` +
    `${esc(ref)}, ${esc(status)}, ${esc(link)}, ${esc(obs)}, ${esc(deadline)}, ` +
    `${esc(caption)}, ${esc(videoLink)}, ${esc(coverLink)}, ` +
    `${semana ?? 'NULL'}, ${numVideo ?? 'NULL'});`
  )
}

const lines = [
  '-- Importação: mh_posts (Máquina de Hits)',
  `-- Arquivo: ${csvPath}`,
  `-- Gerado em: ${new Date().toISOString()}`,
  '',
  'DELETE FROM mh_posts;',
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
