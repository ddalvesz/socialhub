/**
 * Import MH CSV → SQL INSERT statements for Supabase
 *
 * Usage:
 *   node scripts/import-mh-csv.mjs "caminho/para/MH.csv" > mh_import.sql
 *
 * Depois rode o arquivo SQL gerado no Supabase SQL Editor.
 *
 * Pré-requisito: ALTER TABLE posts ADD COLUMN IF NOT EXISTS mh jsonb;
 */

import { readFileSync } from 'fs'

const CREATOR_MAP = {
  'CARINA': 'CARINA',
  'REBECA': 'REBECA',
  'THA': 'THA',
  'MARINA': 'MARINA',
  'RECICLADO': 'RECICLADO',
  'CREATORS COPA': null, // skip
}

const OWNER_MAP = {
  'CARINA': 'Carina',
  'REBECA': 'Rebeca',
  'THA': 'Tha',
  'MARINA': 'Marina',
  'RECICLADO': 'Reciclado',
}

function parseDate(ddmm) {
  if (!ddmm || ddmm.trim() === '') return null
  const [d, m] = ddmm.trim().split('/')
  if (!d || !m) return null
  return `2026-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function mapStatus(statusCol, postado) {
  const s = (statusCol || '').trim()
  const p = (postado || '').trim().toUpperCase()
  if (p === 'TRUE') return 'pub'
  if (s === 'Em pauta') return 'pauta'
  if (s === 'Entregue') return 'entregue'
  if (s === 'Agendado') return 'sched'
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
  // Remove BOM
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
  if (s === null || s === undefined) return 'NULL'
  return `'${String(s).replace(/'/g, "''")}'`
}

function escJson(obj) {
  if (obj === null || obj === undefined) return 'NULL'
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`
}

function escArr(arr) {
  if (!arr || arr.length === 0) return "ARRAY[]::text[]"
  return `ARRAY[${arr.map(esc).join(',')}]`
}

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('Uso: node scripts/import-mh-csv.mjs "caminho/para/MH.csv" > mh_import.sql')
  process.exit(1)
}

const text = readFileSync(csvPath, 'utf-8')
const rows = csvParse(text)

// Skip header rows (first 2 rows are headers)
const dataRows = rows.slice(2)

// Track semana per creator for unnumbered rows
const creatorSemanaTracker = {}
const creatorVideoTracker = {}

const inserts = []

for (const row of dataRows) {
  const semanaRaw   = row[0]  || ''
  const videoRaw    = row[1]  || ''
  const donoRaw     = row[2]  || ''
  const hook        = row[3]  || ''
  const ref         = row[4]  || ''
  const obs         = row[5]  || ''
  const produto     = row[6]  || ''
  const statusRaw   = row[7]  || ''
  const link        = row[8]  || ''
  const dateIG      = row[9]  || ''
  const timeIG      = row[10] || ''
  const postadoIG   = row[11] || ''
  const dateTT      = row[12] || ''
  const timeTT      = row[13] || ''
  const postadoTT   = row[14] || ''
  const linkDoc     = row[15] || ''

  if (!hook.trim()) continue

  const creator = CREATOR_MAP[donoRaw.trim()]
  if (creator === null) continue // skip CREATORS COPA
  if (!creator) continue

  const semana = parseSemana(semanaRaw) ?? (creatorSemanaTracker[creator] || 1)
  creatorSemanaTracker[creator] = semana

  let numVideo = parseNumVideo(videoRaw)
  if (!numVideo) {
    creatorVideoTracker[creator] = creatorVideoTracker[creator] || {}
    creatorVideoTracker[creator][semana] = (creatorVideoTracker[creator][semana] || 0) + 1
    numVideo = creatorVideoTracker[creator][semana]
  } else {
    creatorVideoTracker[creator] = creatorVideoTracker[creator] || {}
    creatorVideoTracker[creator][semana] = Math.max(creatorVideoTracker[creator][semana] || 0, numVideo)
  }

  const owner = OWNER_MAP[creator] || creator
  const mhBase = {
    creator,
    semanaCreator: semana,
    numVideo,
    audio: '',
    prazo: '',
    dropboxLink: link.trim(),
    briefingFile: linkDoc.trim(),
    repostTT: null,
  }

  // IG post
  const igDate = parseDate(dateIG)
  if (igDate) {
    const igTime  = timeIG.trim() || '12:00'
    const igStatus = mapStatus(statusRaw, postadoIG)
    const mhIG = { ...mhBase }

    inserts.push(
      `INSERT INTO posts (title, owner, platform, date, time, status, complexity, type, tags, linha, campanha, link, ref, notes, product, image_urls, mh) VALUES (` +
      `${esc(hook.trim())}, ${esc(owner)}, 'ig', ${esc(igDate)}, ${esc(igTime)}, ${esc(igStatus)}, 2, 'Reels', ${escArr(['mh'])}, 'trends', NULL, '', ${esc(ref.trim())}, ${esc(obs.trim())}, ${esc(produto.trim())}, ARRAY[]::text[], ${escJson(mhIG)});`
    )
  }

  // TT post
  const ttDate = parseDate(dateTT)
  if (ttDate) {
    const ttTime   = timeTT.trim() || '12:00'
    const ttStatus = mapStatus(statusRaw, postadoTT)
    const mhTT = { ...mhBase, repostTT: null }

    inserts.push(
      `INSERT INTO posts (title, owner, platform, date, time, status, complexity, type, tags, linha, campanha, link, ref, notes, product, image_urls, mh) VALUES (` +
      `${esc(hook.trim())}, ${esc(owner)}, 'tiktok', ${esc(ttDate)}, ${esc(ttTime)}, ${esc(ttStatus)}, 2, 'Vídeo', ${escArr(['mh'])}, 'trends', NULL, '', ${esc(ref.trim())}, ${esc(obs.trim())}, ${esc(produto.trim())}, ARRAY[]::text[], ${escJson(mhTT)});`
    )
  }
}

console.log('-- MH import gerado automaticamente')
console.log('-- Rode primeiro: ALTER TABLE posts ADD COLUMN IF NOT EXISTS mh jsonb;')
console.log('')
console.log('BEGIN;')
console.log('')

for (const sql of inserts) {
  console.log(sql)
}

console.log('')
console.log('-- Vincula posts IG ↔ TikTok pelo título (mesmo que o script de linkedPostId)')
console.log(`
WITH pairs AS (
  SELECT
    ig.id AS ig_id,
    tt.id AS tt_id
  FROM posts ig
  JOIN posts tt ON lower(trim(ig.title)) = lower(trim(tt.title))
    AND ig.platform = 'ig'
    AND tt.platform = 'tiktok'
    AND 'mh' = ANY(ig.tags)
    AND 'mh' = ANY(tt.tags)
    AND ig."linkedPostId" IS NULL
    AND tt."linkedPostId" IS NULL
)
UPDATE posts
SET "linkedPostId" = CASE
  WHEN id IN (SELECT ig_id FROM pairs) THEN (SELECT tt_id FROM pairs WHERE ig_id = posts.id)
  WHEN id IN (SELECT tt_id FROM pairs) THEN (SELECT ig_id FROM pairs WHERE tt_id = posts.id)
END
WHERE id IN (SELECT ig_id FROM pairs UNION SELECT tt_id FROM pairs);
`)

console.log('COMMIT;')
console.log(`\n-- Total: ${inserts.length} posts inseridos`)
